var DRRQueue = require('./index');
var expect = require('chai').expect;
var uuid = require('uuid');

describe('DRRQueue', function () {

    describe('#pop', function () {
        it('returns undefined when the queue is empty', function () {
            var queue = new DRRQueue();
            expect(queue.pop()).to.be.undefined;
        });

        it('returns the only element if there is only one', function () {
            var queue = new DRRQueue();
            var element = uuid.v4();
            queue.push('only-flow', element, 1);
            expect(queue.pop()).to.equal(element);
        });

        it(
            'returns the elements in order if there is only one flow',
            function () {
                var queue = new DRRQueue();
                var element1 = uuid.v4();
                queue.push('only-flow', element1, 1);
                var element2 = uuid.v4();
                queue.push('only-flow', element2, 1);
                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element2);
            }
        );

        it('returns undefined again after emptying the queue', function () {
            var queue = new DRRQueue();
            var element = uuid.v4();
            queue.push('only-flow', element, 1);
            queue.pop();
            expect(queue.pop()).to.be.undefined;
        });

        it(
            'correctly pops elements that are smaller than the quantum',
            function () {
                var queue = new DRRQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 2);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'correctly pops elements that are larger than the quantum',
            function () {
                var queue = new DRRQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 5);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'correctly pops elements that are sized to 0',
            function () {
                var queue = new DRRQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 0);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'alternative between two flows with equal sized elements',
            function () {
                var queue = new DRRQueue();
                var element1 = 'element1';
                queue.push('flow1', element1, 1);
                var element3 = 'element3';
                queue.push('flow1', element3, 1);
                var element2 = 'element2';
                queue.push('flow2', element2, 1);

                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element2);
                expect(queue.pop(), 'third pop').to.equal(element3);
            }
        );

        it(
            'returns two elements in a row from the same queue if they ' +
                'are below the quantum size',
            function () {
                var queue = new DRRQueue({quantumSize: 2});
                var element1 = 'element1';
                queue.push('flow1', element1, 1);
                var element2 = 'element2';
                queue.push('flow2', element2, 1);
                var element3 = 'element3';
                queue.push('flow1', element3, 1);

                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element3);
                expect(queue.pop(), 'third pop').to.equal(element2);
            }
        );

    });

    describe('#push', function () {
        it('requires that the size be a number', function () {
            var queue = new DRRQueue({quantumSize: 4});
            var callWithAString = function () {
                queue.push('only-flow', 'element', {test: true});
            };
            expect(callWithAString).to.throw(
                'The size must be a finite number'
            );
        });

        it('requires that the size be a finite number', function () {
            var queue = new DRRQueue({quantumSize: 4});
            var callWithAString = function () {
                queue.push('only-flow', 'element', Number.NaN);
            };
            expect(callWithAString).to.throw(
                'The size must be a finite number'
            );
        });
    });
    
});
