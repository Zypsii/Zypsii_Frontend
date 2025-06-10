export const calculateSplitBalances = (participants, expenses) => {
  if (!participants || !Array.isArray(participants)) {
    return { balances: [], totalGetBack: 0 };
  }

  // Initialize balances for each participant
  const balances = participants
    .filter(participant => participant && participant.user && participant.user._id)
    .map(participant => ({
      userId: participant.user._id.toString(),
      name: participant.user.fullName || participant.user.email,
      paid: 0,
      share: 0,
      balance: 0,
      status: 'settled'
    }));

  // Calculate balances per expense
  if (expenses && Array.isArray(expenses)) {
    expenses.forEach(expense => {
      if (!expense || !expense.amount || !expense.paidBy) return;

      const sharePerPerson = expense.amount / balances.length;
      const payerId = expense.paidBy.toString();

      balances.forEach(balance => {
        if (balance.userId === payerId) {
          balance.paid += expense.amount;
          balance.share += sharePerPerson;
        } else {
          balance.share += sharePerPerson;
        }
      });
    });
  }

  // Calculate final balances
  balances.forEach(balance => {
    balance.balance = balance.paid - balance.share;
    balance.status = balance.balance > 0 ? 'getBack' : balance.balance < 0 ? 'owe' : 'settled';
  });

  // Calculate total get back amount
  const totalGetBack = balances
    .filter(balance => balance.status === 'getBack')
    .reduce((sum, balance) => sum + balance.balance, 0);

  return {
    balances,
    totalGetBack
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}; 