const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

chai.use(chaiHttp);
chai.should();

// signal app.js not to open socket
process.env.testing = true;

const app = require('./../app');
const metric = require('./../app/metric');

// helper functions
const post = async (path, body) => {
    return new Promise((resolve, reject) => {
        chai.request(app)
            .post(path)
            .send(body)
            .end((err, res) => {
                resolve({ err, res });
            });
    });
};

const get = async (path) => {
    return new Promise((resolve, reject) => {
        chai.request(app)
            .get(path)
            .end((err, res) => {
                resolve({ err, res });
            });
    });
};

describe('POST /metric/{key}', () => {
    it('should return 200 on valid input', async () => {
        const { res } = await post('/metric/active_visitors', { value: 4 });
        res.should.have.status(200);
        res.body.should.be.a('object');
    });

    it('should return 422 on invalid input #1', async () => {
        const { res } = await post('/metric/active_visitors', {});
        res.should.have.status(422);
    });

    it('should return 422 on invalid input #2', async () => {
        const { res } = await post('/metric/active_visitors', { value: 'abc' });
        res.should.have.status(422);
    });
});

describe('GET /metric/{key}/sum', () => {
    beforeEach((done) => {
        metric.reset();
        done();
    });

    it('should return 0 on non-existing key', async () => {
        const { res } = await get('/metric/active_visitors/sum');
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.value.should.equal(0);
    });

    it('should sum', async () => {
        await post('/metric/active_visitors', { value: 2 });
        await post('/metric/active_visitors', { value: 4 });
        const { res } = await get('/metric/active_visitors/sum');
        res.should.have.status(200);
        res.body.value.should.equal(6);
    });

    it('should round to nearest integer', async () => {
        await post('/metric/active_visitors', { value: 2.1 });

        await (async () => {
            const { res } = await get('/metric/active_visitors/sum');
            res.should.have.status(200);
            res.body.value.should.equal(2);
        })();

        await (async () => {
            await post('/metric/active_visitors', { value: .4 });
            const { res } = await get('/metric/active_visitors/sum');
            res.should.have.status(200);
            res.body.value.should.equal(3);
        })();
    });

    it('should ignore old data', async () => {
        const clock = sinon.useFakeTimers();

        await post('/metric/active_visitors', { value: 4 });
        clock.tick(2 * 60 * 60 * 1000); // 2h

        await post('/metric/active_visitors', { value: 3 });
        clock.tick(30 * 60 * 1000); // 30m

        await post('/metric/active_visitors', { value: 7 });
        clock.tick(40 * 1000); // 40s

        await post('/metric/active_visitors', { value: 2 });
        clock.tick(5 * 1000); // 5s

        const { res } = await get('/metric/active_visitors/sum');
        res.should.have.status(200);
        res.body.value.should.equal(12);

        clock.restore();
    });
});