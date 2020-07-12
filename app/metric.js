let db = {};

// for testing
const reset = () => {
    db = {};
};

const get = (key) => {
    return db[key];
};

const record = (key, value) => {
    if (!(key in db)) {
        db[key] = [];
    }
    const now = new Date();
    db[key].push({ value, time: now });
    return true;
};

const isRecent = (data) => {
    const now = new Date();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    return data.time.getTime() > (now.getTime() - ONE_HOUR_MS);
};

const sum = (key) => {
    let value = 0;
    if (!(key in db)) {
        return value;
    }

    const rows = db[key];
    if (rows.length === 0) {
        return value;
    }

    for (let i = (rows.length - 1); i >= 0; i--) {
        const row = rows[i];
        const isNumber = !isNaN(row.value);
        if (!isNumber) {
            continue;
        }
        if (!isRecent(row)) {
            maybeTrimDb(key);
            break;
        }
        value += row.value;
    }
    value = Math.round(value);

    return value;
};

const maybeTrimDb = (key) => {
    setTimeout(() => {
        if (!(key in db)) {
            return;
        }

        const rows = db[key];
        let numRecent = 0;
        let trimEndIndex;
        for (let i = (rows.length - 1); i >= 0; i--) {
            const row = rows[i];
            if (!isRecent(row)) {
                trimEndIndex = i;
                break;
            }
            numRecent++;
        }

        if (trimEndIndex === undefined) {
            return;
        }

        // trimming strategy: if half or more of the data is old
        if (numRecent < (rows.length / 2)) {
            rows.splice(0, trimEndIndex + 1);
        }
    }, 1);
};

module.exports = {
    record
    , sum
    , reset
    , get
};
