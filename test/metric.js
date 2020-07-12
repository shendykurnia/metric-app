const chai = require('chai');
const sinon = require('sinon');

chai.should();

const metric = require('./../app/metric');

describe('metric', () => {
    it('should prune old data', async () => {
        const clock = sinon.useFakeTimers();

        const key = 'some-key';
        metric.record(key, 1);
        clock.tick(60 * 1000); // 1s
        metric.record(key, 2);
        clock.tick(60 * 1000); // 1s
        metric.record(key, 3);
        clock.tick(60 * 1000); // 1s
        metric.record(key, 4);
        clock.tick(2 * 60 * 60 * 1000); // 2h

        metric.record(key, 5);
        clock.tick(30 * 60 * 1000); // 30m
        metric.record(key, 6);
        clock.tick(40 * 1000); // 40s

        metric.sum(key);
        clock.tick(1000); // 1s

        const rows = metric.get(key);
        const numbers = rows.map(row => row.value);
        numbers.should.include(5);
        numbers.should.include(6);
        numbers.length.should.equal(2);

        clock.restore();
    });
});
