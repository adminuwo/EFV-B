const fs = require('fs');
const path = require('path');

// Simple promise-based mutex for file operations to prevent race conditions
const locks = new Map();

async function withLock(filepath, operation) {
    if (!locks.has(filepath)) {
        locks.set(filepath, Promise.resolve());
    }

    const currentLock = locks.get(filepath);
    const newLock = currentLock.then(async () => {
        try {
            return await operation();
        } catch (error) {
            console.error(`Lock operation error on ${filepath}:`, error);
            throw error;
        }
    });

    locks.set(filepath, newLock);
    return newLock;
}

class JsonDB {
    constructor(filename) {
        this.filepath = path.join(__dirname, '..', 'data', filename);
        this.init();
    }

    init() {
        const dataDir = path.dirname(this.filepath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        if (!fs.existsSync(this.filepath)) {
            fs.writeFileSync(this.filepath, JSON.stringify([], null, 2), 'utf8');
        }
    }

    async read() {
        return withLock(this.filepath, async () => {
            try {
                if (!fs.existsSync(this.filepath)) return [];
                const data = fs.readFileSync(this.filepath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error(`Error reading ${this.filepath}:`, error);
                return [];
            }
        });
    }

    async write(data) {
        return withLock(this.filepath, async () => {
            try {
                fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`💾 JSON DB WRITE SUCCESS: ${path.basename(this.filepath)} (${data.length} items)`);
                return true;
            } catch (error) {
                console.error(`Error writing to ${this.filepath}:`, error);
                return false;
            }
        });
    }

    // CRUD Operations
    async getAll() {
        return this.read();
    }

    async getById(id) {
        const data = await this.read();
        const sid = String(id);
        return data.find(item => String(item._id || item.id) === sid);
    }

    async create(item) {
        return withLock(this.filepath, async () => {
            const data = [];
            try {
                const existing = fs.readFileSync(this.filepath, 'utf8');
                data.push(...JSON.parse(existing));
            } catch (e) { }

            if (!item._id && !item.id) {
                item._id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            }
            item.createdAt = new Date().toISOString();
            item.updatedAt = new Date().toISOString();

            data.push(item);
            fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf8');
            return item;
        });
    }

    async update(id, updatesOrFn) {
        return withLock(this.filepath, async () => {
            const data = [];
            try {
                const existing = fs.readFileSync(this.filepath, 'utf8');
                data.push(...JSON.parse(existing));
            } catch (e) { }

            const sid = String(id);
            const index = data.findIndex(item => String(item._id || item.id) === sid);

            if (index !== -1) {
                if (typeof updatesOrFn === 'function') {
                    // Atomic transformation
                    data[index] = updatesOrFn(data[index]);
                } else {
                    // Basic merge
                    data[index] = { ...data[index], ...updatesOrFn, updatedAt: new Date().toISOString() };
                }

                fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2), 'utf8');
                return data[index];
            }
            return null;
        });
    }

    async delete(id) {
        return withLock(this.filepath, async () => {
            const data = [];
            try {
                const existing = fs.readFileSync(this.filepath, 'utf8');
                data.push(...JSON.parse(existing));
            } catch (e) { }

            const sid = String(id);
            const filteredData = data.filter(item => String(item._id || item.id) !== sid);

            if (data.length !== filteredData.length) {
                fs.writeFileSync(this.filepath, JSON.stringify(filteredData, null, 2), 'utf8');
                return true;
            }
            return false;
        });
    }
}

module.exports = JsonDB;
