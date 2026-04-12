// src/services/debtService.js
const Debt = require('../models/Debt');
const User = require('../models/User');

/**
 * Auto-create debts from a bill
 * Called after AI extraction or manual bill creation
 * 
 * Handles both registered and unregistered users
 * Supports group splitting (assignedTo = [])
 * 
 * ✅ SMART LOGIC:
 * - Người được gán = bill creator → SKIP (không nợ chính mình)
 * - Người được gán = registered user khác → tạo OWED_TO + OWED_FROM (2 way sync)
 * - Người được gán = unregistered → chỉ tạo OWED_FROM (không có userId)
 */
async function createDebtsFromBill(bill, userIdMap = {}) {
    try {
        if (!bill || !bill.people || bill.people.length === 0) {
            console.log('No people in bill, skipping debt creation');
            return [];
        }

        const debts = [];
        const billCreatorId = bill.userId;

        // Get bill creator's username for display
        let billCreatorName = 'Bill Creator';
        try {
            const creator = await User.findById(billCreatorId, 'username');
            if (creator) {
                billCreatorName = creator.username;
            }
        } catch (err) {
            console.warn('⚠️ Could not fetch bill creator name:', err.message);
        }

        // ========== STEP 0: BUILD PEOPLE INFO IF NOT PROVIDED ==========
        // Fetch user info for each person to determine if registered or unregistered
        let peopleInfo = bill.peopleInfo || [];
        
        if (peopleInfo.length === 0 && bill.people.length > 0) {
            // Nếu frontend không gửi peopleInfo, build từ people list
            for (let i = 0; i < bill.people.length; i++) {
                const personName = bill.people[i];
                const isCurrentUser = personName === billCreatorName;
                
                peopleInfo.push({
                    name: personName,
                    isCurrentUser: isCurrentUser,
                    index: i
                });
            }
        } else if (peopleInfo.length > 0) {
            // Frontend gửi peopleInfo - add index field
            peopleInfo = peopleInfo.map((info, idx) => ({
                ...info,
                index: idx
            }));
        }

        // ========== STEP 1: CALCULATE TOTAL DEBT PER PERSON ==========
        const personDebts = {}; // { personIndex: totalAmount }

        if (bill.items && Array.isArray(bill.items)) {
            for (const item of bill.items) {
                const itemPrice = item.price || 0;
                const itemQuantity = item.quantity || 1;
                const itemTotal = itemPrice * itemQuantity;

                // CASE 1: Assigned to specific people
                if (item.assignedTo && item.assignedTo.length > 0) {
                    const shareAmount = itemTotal / item.assignedTo.length;
                    for (const personIndex of item.assignedTo) {
                        personDebts[personIndex] = (personDebts[personIndex] || 0) + shareAmount;
                    }
                }
                // CASE 2: Shared with everyone
                else {
                    const shareAmount = itemTotal / bill.people.length;
                    for (let i = 0; i < bill.people.length; i++) {
                        personDebts[i] = (personDebts[i] || 0) + shareAmount;
                    }
                }
            }
        }

        // ========== STEP 2: BUILD USER MAP (query database) ==========
        // Query each person to check if they're registered users
        const userMap = {}; // { personName: { userId, isRegistered } }
        
        for (const personInfo of peopleInfo) {
            const personName = personInfo.name;
            
            // Skip if this is current user (bill creator)
            if (personInfo.isCurrentUser) {
                console.log(`ℹ️  Skipping self (${personName}) - no debt for bill creator`);
                continue;
            }
            
            // Query database to find user
            try {
                const foundUser = await User.findOne({ username: personName });
                if (foundUser) {
                    userMap[personName] = {
                        userId: foundUser._id,
                        isRegistered: true
                    };
                    console.log(`✅ Found registered user: ${personName}`);
                } else {
                    userMap[personName] = {
                        userId: null,
                        isRegistered: false
                    };
                    console.log(`⚠️  Unregistered user: ${personName}`);
                }
            } catch (err) {
                userMap[personName] = {
                    userId: null,
                    isRegistered: false
                };
                console.warn(`⚠️  Error checking user ${personName}:`, err.message);
            }
        }

        // ========== STEP 3: CREATE DEBT RECORDS ==========
        for (const [personIndexStr, totalAmount] of Object.entries(personDebts)) {
            const personIndex = parseInt(personIndexStr);
            const personInfo = peopleInfo[personIndex];
            const personName = personInfo.name;

            // ✅ SKIP if person is bill creator (self)
            if (personInfo.isCurrentUser) {
                console.log(`ℹ️  Skipping debt creation for self (${personName})`);
                continue;
            }

            const userInfo = userMap[personName] || { userId: null, isRegistered: false };
            const debtorId = userInfo.userId;
            const isRegistered = userInfo.isRegistered;

            // ✅ CREATE OWED_TO RECORD (person nợ bill creator)
            const debtRecord = new Debt({
                userId: debtorId || personName,                 // Registered user ID hoặc name
                creditorId: debtorId ? billCreatorId : null,   // Chỉ set nếu registered
                creditorName: billCreatorName,
                creditorPhone: null,
                billId: bill._id,
                amount: totalAmount,
                type: 'OWED_TO',
                description: `${bill.name}`,
                status: isRegistered ? 'PENDING_VERIFICATION' : 'PENDING'
            });
            await debtRecord.save();
            debts.push(debtRecord);
            console.log(`📝 Created OWED_TO: ${personName} owes ${billCreatorName} - ${totalAmount}đ (Registered: ${isRegistered})`);

            // ✅ CREATE OWED_FROM RECORD (bill creator được nợ bởi person)
            // Chỉ tạo nếu person là registered user
            if (isRegistered) {
                const reverseDebtRecord = new Debt({
                    userId: billCreatorId,
                    creditorId: debtorId,
                    creditorName: null,
                    creditorPhone: null,
                    billId: bill._id,
                    amount: totalAmount,
                    type: 'OWED_FROM',
                    description: `${bill.name}`,
                    status: 'PENDING_VERIFICATION'
                });
                await reverseDebtRecord.save();
                debts.push(reverseDebtRecord);
                console.log(`📝 Created OWED_FROM: ${billCreatorName} is owed by ${personName} (Registered) - ${totalAmount}đ`);
            } else {
                // Unregistered user: create OWED_FROM so bill creator sees debt
                const reverseDebtRecord = new Debt({
                    userId: billCreatorId,                       // Người tạo
                    creditorId: null,                           // Unregistered
                    creditorName: personName,                   // Tên của người nợ
                    creditorPhone: null,
                    billId: bill._id,
                    amount: totalAmount,
                    type: 'OWED_FROM',                          // Được nợ
                    description: `${bill.name}`,
                    status: 'PENDING'
                });
                await reverseDebtRecord.save();
                debts.push(reverseDebtRecord);
                console.log(`📝 Created OWED_FROM: ${billCreatorName} is owed by ${personName} (Unregistered) - ${totalAmount}đ`);
            }
        }

        console.log(`✅ Created ${debts.length} debts from bill ${bill._id} (${Object.keys(personDebts).length} people)`);
        return debts;

    } catch (error) {
        console.error('❌ Error creating debts from bill:', error);
        throw error;
    }
}

module.exports = {
    createDebtsFromBill
};
