
pragma solidity ^0.4.8;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EntryQueue.sol";

/**
 * Test the EntryQueue library directly using a local instance of the
 * EntryQueue.Queue.
 */

contract TestEntryQueue {

    using EntryQueue for EntryQueue.Queue;
    EntryQueue.Queue queue;

    address A1 = 0x1;
    address A2 = 0x2;
    address A3 = 0x3;

    bytes32 ID1 = sha3("1");
    bytes32 ID2 = sha3("2");
    bytes32 ID3 = sha3("3");

    address account;
    uint value;
    bool filled;

    function beforeEach() {
      removeAll(queue);
    }

    function testQueueFullTest() {
        Assert.equal(queue.length, 0, "Initially 0 length");
        queue.pushTail(ID1, A1, 100);
        queue.pushTail(ID2, A2, 200);
        queue.pushTail(ID3, A3, 300);
        Assert.equal(queue.length, 3, "Three entries expected");

        (account, value, filled) = queue.get(ID1);
        Assert.equal(account, A1, "Account matches");
        (account, value, filled) = queue.get(ID2);
        Assert.equal(account, A2, "Account matches");
        (account, value, filled) = queue.get(ID3);
        Assert.equal(account, A3, "Account matches");
    }

    function testGetOpenIsOrdered() {
        bytes32[] memory ids = queue.getOpen();
        Assert.equal(ids.length, 0, "Initially 0 length");
        queue.pushTail(ID1, A1, 100);
        queue.pushTail(ID2, A2, 200);

        ids = queue.getOpen();
        Assert.equal(ids.length, 2, "Expected length");
        Assert.equal(ids[0], ID1, "Id order");
        Assert.equal(ids[1], ID2, "Id order");

        queue.pushHead(ID3, A3, 100);
        ids = queue.getOpen();
        Assert.equal(ids.length, 3, "Expected length");
        Assert.equal(ids[0], ID3, "Id order");
        Assert.equal(ids[1], ID1, "Id order");
        Assert.equal(ids[2], ID2, "Id order");

        queue.remove(ID1);
        ids = queue.getOpen();
        Assert.equal(ids.length, 2, "Expected length");
        Assert.equal(ids[0], ID3, "Id order");
        Assert.equal(ids[1], ID2, "Id order");

        queue.remove(ID3);
        ids = queue.getOpen();
        Assert.equal(ids.length, 1, "Expected length");
        Assert.equal(ids[0], ID2, "Id order");

        queue.remove(ID2);
        ids = queue.getOpen();
        Assert.equal(ids.length, 0, "Expected length");
    }

    function testPushTailOnEmptyQueue() {
        Assert.equal(queue.length, 0, "Initially 0 length");
        queue.pushTail(ID1, A1, 100);
        Assert.equal(queue.length, 1, "One entry");
        Assert.equal(queue.head, ID1, "Head set");
        Assert.equal(queue.tail, ID1, "Tail set");

        (account, value, filled) = queue.get(ID1);
        Assert.equal(account, A1, "Account matches");
        Assert.equal(value, 100, "Value matches");
        Assert.isFalse(filled, "Should not be filled");
    }

    function testPushHeadOnEmptyQueue() {
        Assert.equal(queue.length, 0, "Initially 0 length");
        queue.pushHead(ID1, A1, 100);
        Assert.equal(queue.length, 1, "One entry");
        Assert.equal(queue.head, ID1, "Head set");
        Assert.equal(queue.tail, ID1, "Tail set");

        (account, value, filled) = queue.get(ID1);
        Assert.equal(account, A1, "Account matches");
        Assert.equal(value, 100, "Value matches");
        Assert.isFalse(filled, "Should not be filled");
    }

    function testPushHeadOnNonEmptyQueue() {
        queue.pushTail(ID1, A1, 100);
        queue.pushHead(ID2, A2, 100);
        Assert.equal(queue.length, 2, "Expected length");
        Assert.equal(queue.head, ID2, "Head set");
        Assert.equal(queue.tail, ID1, "Tail set");

        bytes32[] memory ids = queue.getOpen();
        Assert.equal(ids.length, 2, "Expected length");
        Assert.equal(ids[0], ID2, "Id order");
        Assert.equal(ids[1], ID1, "Id order");
    }

    function testRemoveFromHead() {
        queue.pushTail(ID1, A1, 100);
        queue.pushTail(ID2, A2, 200);
        Assert.equal(queue.length, 2, "Expected length");
        queue.remove(ID1);
        Assert.equal(queue.length, 1, "Expected length");

        bytes32[] memory ids = queue.getOpen();
        Assert.equal(ids[0], ID2, "Id order");
    }

    function testRemoveFromTail() {
        queue.pushTail(ID1, A1, 100);
        queue.pushTail(ID2, A2, 200);
        Assert.equal(queue.length, 2, "Expected length");
        queue.remove(ID2);
        Assert.equal(queue.length, 1, "Expected length");

        bytes32[] memory ids = queue.getOpen();
        Assert.equal(ids[0], ID1, "Id order");
    }

    function testRemoveFromMiddle() {
        queue.pushTail(ID1, A1, 100);
        queue.pushTail(ID2, A2, 200);
        queue.pushTail(ID3, A3, 200);
        Assert.equal(queue.length, 3, "Expected length");
        queue.remove(ID2);
        Assert.equal(queue.length, 2, "Expected length");

        bytes32[] memory ids = queue.getOpen();
        Assert.equal(ids[0], ID1, "Expected 1 at position 1");
        Assert.equal(ids[1], ID3, "Expected 3 at position 2");
    }

    /**
     * Just reset the pointers.
     */
    function removeAll(EntryQueue.Queue storage queue)
        internal
    {
        queue.head = 0x0;
        queue.tail = 0x0;
        queue.length = 0;
    }

}
