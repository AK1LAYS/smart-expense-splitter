/**
 * Smart Expense Splitter - Settlement Service & Smart Optimizer
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

class SettlementService {
  /**
   * Calculates net balances for all members across all expenses
   * @param {Array<string>} members 
   * @param {Array<Object>} expenses 
   * @returns {Object} netBalances map { [member]: number }
   */
  static calculateNetBalances(members, expenses) {
    const balances = {};
    const paidTotals = {};
    const owedTotals = {};

    // Initialize map
    members.forEach(member => {
      balances[member] = 0;
      paidTotals[member] = 0;
      owedTotals[member] = 0;
    });

    expenses.forEach(exp => {
      const payer = exp.paidBy;
      const amount = parseFloat(exp.amount) || 0;

      // Credit the payer
      if (balances[payer] !== undefined) {
        balances[payer] += amount;
        paidTotals[payer] += amount;
      }

      // Debit each participant for their share
      if (exp.splits) {
        Object.entries(exp.splits).forEach(([participant, share]) => {
          const shareAmount = parseFloat(share) || 0;
          if (balances[participant] !== undefined) {
            balances[participant] -= shareAmount;
            owedTotals[participant] += shareAmount;
          }
        });
      }
    });

    // Format results to 2 decimal places
    const memberSummary = members.map(member => {
      const net = Math.round(balances[member] * 100) / 100;
      return {
        member,
        totalPaid: Math.round(paidTotals[member] * 100) / 100,
        totalOwed: Math.round(owedTotals[member] * 100) / 100,
        netBalance: net,
        status: net > 0 ? 'gets_back' : net < 0 ? 'owes' : 'settled'
      };
    });

    return { balances, memberSummary };
  }

  /**
   * Smart Settlement Optimizer (Greedy Min-Cash-Flow Algorithm)
   * Calculates the minimum number of transactions needed to settle all debts
   * @param {Object} balancesMap { [member]: number }
   * @returns {Array<Object>} Array of optimized settlement transactions
   */
  static optimizeSettlements(balancesMap) {
    // Clone and round
    const balances = {};
    Object.keys(balancesMap).forEach(m => {
      const b = Math.round(balancesMap[m] * 100) / 100;
      if (Math.abs(b) >= 0.01) {
        balances[m] = b;
      }
    });

    const creditors = []; // People who get back money (positive balance)
    const debtors = [];   // People who owe money (negative balance)

    Object.entries(balances).forEach(([member, balance]) => {
      if (balance > 0) {
        creditors.push({ member, amount: balance });
      } else if (balance < 0) {
        debtors.push({ member, amount: Math.abs(balance) });
      }
    });

    // Sort to optimize settlement greedy matches
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const settleAmount = Math.min(creditor.amount, debtor.amount);
      const roundedAmount = Math.round(settleAmount * 100) / 100;

      if (roundedAmount > 0) {
        settlements.push({
          from: debtor.member,
          to: creditor.member,
          amount: roundedAmount,
          formatted: `${debtor.member} pays ${creditor.member} ₹${roundedAmount.toFixed(2)}`
        });
      }

      creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;
      debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;

      if (creditor.amount < 0.01) cIdx++;
      if (debtor.amount < 0.01) dIdx++;
    }

    return settlements;
  }
}

module.exports = SettlementService;
