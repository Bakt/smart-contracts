pragma solidity ^0.4.8;

/**
 * Provides routines and data structures to maintain a Queue of Entries. An
 * entry represents the desire to enter a contract for a given amount.
 *
 * Data structure:
 *  - is ordered from head to tail
 *  - can add entries to the head or the tail
 *  - can remove entries from any position
 *  - can return an ordered list of entry ids
 *
 * Each entry has a link to the next and previous entry.
 * NEXT moves towards the HEAD, PREV moves towards the TAIL.
 *
 * NOTE: could be split into generic Queue code and market Entry specific code
 *         once templates / generics are added to the Solidity language:
 *            https://github.com/ethereum/solidity/issues/869
 */
library EntryQueue {

    struct Queue {
        bytes32 head;
        bytes32 tail;
        uint length;
        mapping (bytes32 => Entry) entries;
    }

    struct Entry {
        address account;
        uint value;                     // in wei
        bool filled;
        EntryIds ids;
    }

    struct EntryIds {
        bytes32 id;
        bytes32 next;
        bytes32 prev;
    }

    /**
     * @dev Initialize the Queue structure.
     */
    function init(Queue storage self) {
        self.head = 0;
        self.tail = 0;
        self.length = 0;
    }

    /**
     * @dev Push new entry on to the tail of the Queue.
     */
    function pushTail(
        Queue storage self,
        bytes32 entryId,
        address account,
        uint value
    )
        internal
    {
        bytes32 oldTail = self.tail;
        EntryIds memory ids = EntryIds(entryId, oldTail, 0);
        self.entries[entryId] = Entry(account, value, false, ids);
        self.tail = entryId;
        if (oldTail != 0) {
            self.entries[oldTail].ids.prev = entryId;
        }
        if (self.head == 0) { // this push is the 1st item in list so both head and tail point to it
            self.head = entryId;
        }
        self.length++;
    }

    /**
     * @dev Push new entry on to the head of the Queue.
     */
    function pushHead(
        Queue storage self,
        bytes32 entryId,
        address account,
        uint value
    )
        internal
    {
        bytes32 oldHead = self.head;
        EntryIds memory ids = EntryIds(entryId, 0, oldHead);
        self.entries[entryId] = Entry(account, value, false, ids);
        self.head = entryId;
        if (oldHead != 0) {
            self.entries[oldHead].ids.next = entryId;
        }
        if (self.tail == 0) { // this push is the 1st item in list so both head and tail point to it
            self.tail = entryId;
        }
        self.length++;
    }

    /**
     * @dev Remove Entry record from the Queue and set filled to true.
     */
    function remove(
        Queue storage self,
        bytes32 _entryId
    )
        internal
    {
        if (self.length == 0)
            return;

        Entry entry = self.entries[_entryId];
        if (entry.filled == true || entry.ids.id == 0)
            return; // removed already

        EntryIds ids = entry.ids;
        if (ids.prev == 0 && ids.next == 0) {           // only entry in list
            self.head = 0;
            self.tail = 0;
        } else if (entry.ids.next == 0) {               // at head
            self.head = ids.prev;
            self.entries[ids.prev].ids.next = 0;
        } else if (entry.ids.prev == 0) {               // at tail
            self.tail = ids.next;
            self.entries[ids.next].ids.prev = 0;
        } else {                                        // in between 2 entries
            self.entries[ids.prev].ids.next = ids.next;
            self.entries[ids.next].ids.prev = ids.prev;
        }

        entry.filled = true;

        // Delete ... ?
        // delete market.entries[_entryId];

        self.length--;
    }

    function get(
        Queue storage self,
        bytes32 entryId
    )
        internal
        constant
        returns (
            address account,
            uint value,
            bool filled
        )
    {
        Entry e = self.entries[entryId];
        return (e.account, e.value, e.filled);
    }

    /**
     * @dev Get ids for all open (not yet filled) entries on this queue.
     * @return ids in QUEUE ORDER - from HEAD (id[0]) to TAIL (ids[ids.length-1])
     */
    function getOpen(Queue storage self)
        internal
        constant
        returns (bytes32[] ids)
    {
        ids = new bytes32[](self.length);
        bytes32 entryId = self.head;
        uint idx = 0;
        while(entryId != 0) {
            ids[idx++] = entryId;
            entryId = self.entries[entryId].ids.prev;
        }
    }

}
