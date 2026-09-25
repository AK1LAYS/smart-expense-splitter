/**
 * Smart Expense Splitter - Split Calculator Service
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

class SplitCalculator {
  /**
   * Calculate splits based on splitType
   * @param {number} totalAmount 
   * @param {string} splitType 'EQUAL' | 'PERCENTAGE' | 'CUSTOM'
   * @param {Array<string>} participants 
   * @param {Object} splitDetails - custom amounts or percentage values
   * @returns {Object} { [participant]: amount }
   */
  static calculateSplits(totalAmount, splitType, participants, splitDetails = {}) {
    const amount = parseFloat(Number(totalAmount).toFixed(2));
    
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      throw new Error('At least one participant is required for splitting');
    }

    if (amount <= 0 || isNaN(amount)) {
      throw new Error('Expense amount must be a positive number');
    }

    switch (splitType.toUpperCase()) {
      case 'EQUAL':
        return this.calculateEqualSplit(amount, participants);

      case 'PERCENTAGE':
        return this.calculatePercentageSplit(amount, participants, splitDetails);

      case 'CUSTOM':
        return this.calculateCustomSplit(amount, participants, splitDetails);

      default:
        throw new Error(`Invalid split type '${splitType}'. Supported types: EQUAL, PERCENTAGE, CUSTOM`);
    }
  }

  /**
   * Equal Split: Divides the amount equally among all participants
   */
  static calculateEqualSplit(totalAmount, participants) {
    const count = participants.length;
    const baseShare = Math.floor((totalAmount / count) * 100) / 100;
    let remainder = Math.round((totalAmount - (baseShare * count)) * 100) / 100;

    const splits = {};
    participants.forEach((p, index) => {
      let share = baseShare;
      // Distribute any remainder cents to the first few participants
      if (remainder > 0.001) {
        share = Math.round((share + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      splits[p] = share;
    });

    return splits;
  }

  /**
   * Percentage Split: Divides based on defined percentage for each participant
   */
  static calculatePercentageSplit(totalAmount, participants, splitDetails) {
    if (!splitDetails || typeof splitDetails !== 'object') {
      throw new Error('Percentage breakdown details must be provided');
    }

    let totalPercentage = 0;
    participants.forEach(p => {
      const pct = parseFloat(splitDetails[p]);
      if (isNaN(pct) || pct < 0) {
        throw new Error(`Invalid percentage for participant '${p}'`);
      }
      totalPercentage += pct;
    });

    // Tolerate tiny float roundoff up to 0.01%
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Total percentage must equal 100%. Current sum: ${totalPercentage.toFixed(2)}%`);
    }

    const splits = {};
    let allocatedTotal = 0;

    participants.forEach((p, idx) => {
      const pct = parseFloat(splitDetails[p]);
      if (idx === participants.length - 1) {
        // Last participant gets exact remaining to prevent rounding drift
        const remaining = Math.round((totalAmount - allocatedTotal) * 100) / 100;
        splits[p] = remaining;
      } else {
        const share = Math.round(((pct / 100) * totalAmount) * 100) / 100;
        splits[p] = share;
        allocatedTotal += share;
      }
    });

    return splits;
  }

  /**
   * Custom Split: Validates exact split amounts
   */
  static calculateCustomSplit(totalAmount, participants, splitDetails) {
    if (!splitDetails || typeof splitDetails !== 'object') {
      throw new Error('Custom split breakdown must be provided');
    }

    let customSum = 0;
    const splits = {};

    participants.forEach(p => {
      const share = parseFloat(splitDetails[p]);
      if (isNaN(share) || share < 0) {
        throw new Error(`Invalid custom amount for participant '${p}'`);
      }
      const roundedShare = Math.round(share * 100) / 100;
      splits[p] = roundedShare;
      customSum += roundedShare;
    });

    customSum = Math.round(customSum * 100) / 100;

    if (Math.abs(customSum - totalAmount) > 0.01) {
      throw new Error(
        `Custom split total (₹${customSum}) must equal the expense amount (₹${totalAmount})`
      );
    }

    return splits;
  }
}

module.exports = SplitCalculator;
