const JsonDB = require('../utils/jsonDB');

/**
 * Enhanced JSON Model Adapter to mimic Mongoose behavior.
 * Returns a Query-like object for chaining (.populate, .sort, etc.)
 */
class JsonModel {
    static _attachSave(obj, dbInstance) {
        if (!obj) return null;
        if (Array.isArray(obj)) {
            return obj.map(item => JsonModel._attachSave(item, dbInstance));
        }

        Object.defineProperty(obj, 'save', {
            value: async function () {
                const id = this._id || this.id;
                if (id) {
                    return dbInstance.update(id, this);
                } else {
                    const created = dbInstance.create(this);
                    Object.assign(this, created);
                    return this;
                }
            },
            enumerable: false,
            writable: true,
            configurable: true
        });
        return obj;
    }

    static createModel(filename) {
        const db = new JsonDB(filename);

        class Query {
            constructor(results) {
                this.results = results;
            }
            populate() { return this; }
            sort() { return this; }
            limit() { return this; }
            select() { return this; }
            skip() { return this; }
            lean() { return this; }
            async exec() { return this.results; }
            // Support thenable (await query)
            then(resolve, reject) {
                return Promise.resolve(this.results).then(resolve, reject);
            }
        }

        return class ModelInstance {
            constructor(data = {}) {
                Object.assign(this, data);
                JsonModel._attachSave(this, db);
            }

            static find(query = {}) {
                const data = db.getAll();

                const matchQuery = (item, queryObj) => {
                    return Object.entries(queryObj).every(([key, value]) => {
                        // Handle $or
                        if (key === '$or' && Array.isArray(value)) {
                            return value.some(subQuery => matchQuery(item, subQuery));
                        }

                        // Handle $and
                        if (key === '$and' && Array.isArray(value)) {
                            return value.every(subQuery => matchQuery(item, subQuery));
                        }

                        // Handle nested keys like "customer.email"
                        let itemValue = item;
                        if (key.includes('.')) {
                            const parts = key.split('.');
                            for (const part of parts) {
                                itemValue = itemValue ? itemValue[part] : undefined;
                            }
                        } else {
                            itemValue = item[key];
                        }

                        if (value instanceof RegExp) return itemValue && value.test(itemValue);
                        return itemValue == value;
                    });
                };

                let results = data;
                if (Object.keys(query).length > 0) {
                    results = data.filter(item => matchQuery(item, query));
                }
                const attached = JsonModel._attachSave(results, db);
                return new Query(attached);
            }

            static findOne(query) {
                const q = this.find(query);
                // Return a query that resolves to the first result
                return new Query(q.then(results => results[0] || null));
            }

            static findById(id) {
                if (!id) return new Query(null);
                const item = db.getById(id.toString());
                const attached = JsonModel._attachSave(item, db);
                return new Query(attached);
            }

            static findByIdAndUpdate(id, updates, options = {}) {
                if (!id) return new Query(null);
                const updated = db.update(id.toString(), updates);
                const attached = JsonModel._attachSave(updated, db);
                return new Query(attached);
            }

            static findOneAndUpdate(query, updates, options = {}) {
                const run = async () => {
                    let item = await this.findOne(query);
                    if (item) {
                        const updatedItem = { ...item, ...updates };
                        const result = db.update(item._id || item.id, updatedItem);
                        return JsonModel._attachSave(result, db);
                    } else if (options.upsert) {
                        return this.create({ ...query, ...updates });
                    }
                    return null;
                };
                return new Query(run());
            }

            static async updateMany(query, updates) {
                const data = db.getAll();
                let modifiedCount = 0;
                const updatedData = data.map(item => {
                    const matches = Object.entries(query).every(([key, value]) => {
                        // Very basic support: doesn't handle nested paths like "items.productId" properly yet
                        return item[key] == value;
                    });
                    if (matches) {
                        modifiedCount++;
                        return { ...item, ...updates.$set }; // Simple $set support
                    }
                    return item;
                });
                db.write(updatedData);
                return { modifiedCount };
            }

            static async create(data) {
                const items = Array.isArray(data) ? data : [data];
                const createdItems = items.map(item => db.create(item));
                const attached = JsonModel._attachSave(createdItems, db);
                return Array.isArray(data) ? attached : attached[0];
            }

            static async deleteMany(query = {}) {
                if (Object.keys(query).length === 0) {
                    db.write([]);
                    return { deletedCount: 'all' };
                }
                const data = db.getAll();
                const filtered = data.filter(item => {
                    return !Object.entries(query).every(([key, value]) => item[key] == value);
                });
                db.write(filtered);
                return { deletedCount: data.length - filtered.length };
            }

            static findByIdAndDelete(id) {
                const run = async () => {
                    const item = await this.findById(id);
                    if (item) {
                        db.delete(id.toString());
                        return item;
                    }
                    return null;
                };
                return new Query(run());
            }

            static findOneAndDelete(query) {
                const run = async () => {
                    const item = await this.findOne(query);
                    if (item) {
                        db.delete((item._id || item.id).toString());
                        return item;
                    }
                    return null;
                };
                return new Query(run());
            }
        };
    }
}

module.exports = {
    User: JsonModel.createModel('users.json'),
    Product: JsonModel.createModel('products.json'),
    Purchase: JsonModel.createModel('purchases.json'),
    Order: JsonModel.createModel('orders.json'),
    Cart: JsonModel.createModel('cart.json'),
    UserProgress: JsonModel.createModel('progress.json'),
    DigitalLibrary: JsonModel.createModel('digital_library.json'),
    Payment: JsonModel.createModel('payments.json'),
    Shipment: JsonModel.createModel('shipments.json'),
    Coupon: JsonModel.createModel('coupons.json'),
    Support: JsonModel.createModel('support.json')
};
