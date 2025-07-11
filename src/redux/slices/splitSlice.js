import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../utils/base_url';

// Fetch Splits List
export const fetchSplits = createAsyncThunk(
  'split/fetchSplits',
  async ({ page = 1, limit = 10 }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${base_url}/split/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit,
        offset: (page - 1) * limit
      }
    });
    return response.data;
  }
);

// Fetch Split Details
export const fetchSplitDetails = createAsyncThunk(
  'split/fetchSplitDetails',
  async (splitId) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${base_url}/split/details/${splitId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
);

// Fetch Split Members
export const fetchSplitMembers = createAsyncThunk(
  'split/fetchSplitMembers',
  async (splitId) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${base_url}/split/list-split-members?splitId=${splitId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(response.data);
    return response.data;

  }
);

// Fetch Split Balance
export const fetchSplitBalance = createAsyncThunk(
  'split/fetchSplitBalance',
  async (splitId) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${base_url}/split/expense/balance-due-details?splitId=${splitId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
);

// Fetch Expenses
export const fetchExpenses = createAsyncThunk(
  'split/fetchExpenses',
  async (splitId) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(`${base_url}/split/list-expense?splitId=${splitId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
);

// Create Split
export const createSplit = createAsyncThunk(
  'split/createSplit',
  async ({ title, participants }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.post(
      `${base_url}/split/add`,
      {
        title,
        participants: participants.map(p => p._id)
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data.status) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to create split');
    }
  }
);

// Add Participant
export const addParticipant = createAsyncThunk(
  'split/addParticipant',
  async ({ splitId, memberIds }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.post(
      `${base_url}/split/add-members`,
      { splitId, memberIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
);

// Add Expense
export const addExpense = createAsyncThunk(
  'split/addExpense',
  async ({ splitId, expenseData }) => {
    const token = await AsyncStorage.getItem('accessToken');
    
    console.log(expenseData ,'expenseData');
    const response = await axios.post(
      `${base_url}/split/add-expense`,
      expenseData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(response ,'response.data');
    return response.data;
  }
);

// Update Expense
export const updateExpense = createAsyncThunk(
  'split/updateExpense',
  async ({ splitId, expenseId, newAmount }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.put(
      `${base_url}/split/update-expense/${expenseId}`,
      {
        splitId,
        newAmount: parseFloat(newAmount)
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
);

// Update Payment Status
export const updatePaymentStatus = createAsyncThunk(
  'split/updatePaymentStatus',
  async ({ expenseId, memberId, paidAt }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.put(
      `${base_url}/split/mark-as-paid`,
      {
        expenseId,
        memberId,
        paidAt
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
);

// Search Users
export const searchUsers = createAsyncThunk(
  'split/searchUsers',
  async ({ searchQuery, selectedUsers }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.get(
      `${base_url}/user/getProfile?search=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.data.success && response.data.data) {
      return response.data.data.filter(u => !selectedUsers.some(su => su._id === u._id));
    }
    return [];
  }
);

// Invite Friend
export const inviteFriend = createAsyncThunk(
  'split/addMember',
  async ({ splitId, memberId }) => {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await axios.post(
      `${base_url}/split/add-members`,
      { splitId, memberIds: [memberId] },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
);

const initialState = {
  // Split List
  splits: [],
  splitsLoading: false,
  splitsError: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  
  // Current Split
  currentSplit: null,
  splitDetailsLoading: false,
  splitDetailsError: null,
  
  // Split Creation
  createSplitLoading: false,
  createSplitError: null,
  
  // User Search
  searchResults: [],
  allSearchResults: [],
  searching: false,
  searchPage: 1,
  hasMoreResults: true,
  userInfo: null,
  selectedUsers: [],
  tempSelectedUsers: [],
  
  // Invite Friend
  inviteLoading: false,
  inviteError: null,
  
  // UI State
  activeTab: 'expenses',
  isAddParticipantModalVisible: false,
  isAddExpenseModalVisible: false,
  isInviteModalVisible: false,
  editingExpenseId: null,
  editedAmount: '',
  
  // Payment Status
  paymentStatusLoading: false,
  paymentStatusError: null,
};

const splitSlice = createSlice({
  name: 'split',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setAddParticipantModalVisible: (state, action) => {
      state.isAddParticipantModalVisible = action.payload;
    },
    setAddExpenseModalVisible: (state, action) => {
      state.isAddExpenseModalVisible = action.payload;
    },
    setInviteModalVisible: (state, action) => {
      state.isInviteModalVisible = action.payload;
    },
    setEditingExpenseId: (state, action) => {
      state.editingExpenseId = action.payload;
    },
    setEditedAmount: (state, action) => {
      state.editedAmount = action.payload;
    },
    clearSplitState: (state) => {
      return initialState;
    },
    setSearchQuery: (state, action) => {
      if (!action.payload.trim()) {
        state.searchResults = [];
        state.allSearchResults = [];
        state.searchPage = 1;
        state.hasMoreResults = true;
      }
    },
    setSelectedUsers: (state, action) => {
      state.selectedUsers = action.payload;
    },
    addSelectedUser: (state, action) => {
      if (!state.selectedUsers.some(u => u._id === action.payload._id)) {
        state.selectedUsers.push(action.payload);
      }
    },
    removeSelectedUser: (state, action) => {
      if (state.userInfo && action.payload === state.userInfo._id) return;
      state.selectedUsers = state.selectedUsers.filter(u => u._id !== action.payload);
    },
    setTempSelectedUsers: (state, action) => {
      state.tempSelectedUsers = action.payload;
    },
    toggleTempSelectedUser: (state, action) => {
      const user = action.payload;
      const isSelected = state.tempSelectedUsers.some(u => u._id === user._id);
      if (isSelected) {
        state.tempSelectedUsers = state.tempSelectedUsers.filter(u => u._id !== user._id);
      } else {
        state.tempSelectedUsers.push(user);
      }
    },
    clearTempSelectedUsers: (state) => {
      state.tempSelectedUsers = [];
    },
    loadMoreSearchResults: (state) => {
      if (!state.hasMoreResults) return;
      
      const nextPage = state.searchPage + 1;
      const startIndex = (nextPage - 1) * 6;
      const endIndex = startIndex + 6;
      const newResults = state.allSearchResults.slice(startIndex, endIndex);
      
      state.searchResults = [...state.searchResults, ...newResults];
      state.searchPage = nextPage;
      state.hasMoreResults = endIndex < state.allSearchResults.length;
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
      if (action.payload) {
        state.selectedUsers = [{
          _id: action.payload._id,
          email: action.payload.email,
          fullName: action.payload.fullName
        }];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Splits
      .addCase(fetchSplits.pending, (state) => {
        state.splitsLoading = true;
        state.splitsError = null;
      })
      .addCase(fetchSplits.fulfilled, (state, action) => {
        state.splitsLoading = false;
        const { data, currentPage, totalPages, totalCount } = action.payload;
        if (currentPage === 1) {
          state.splits = data;
        } else {
          state.splits = [...state.splits, ...data];
        }
        state.currentPage = currentPage;
        state.totalPages = totalPages;
        state.totalCount = totalCount;
      })
      .addCase(fetchSplits.rejected, (state, action) => {
        state.splitsLoading = false;
        state.splitsError = action.error.message;
      })
      
      // Fetch Split Details
      .addCase(fetchSplitDetails.pending, (state) => {
        state.splitDetailsLoading = true;
        state.splitDetailsError = null;
      })
      .addCase(fetchSplitDetails.fulfilled, (state, action) => {
        state.splitDetailsLoading = false;
        state.currentSplit = action.payload;
      })
      .addCase(fetchSplitDetails.rejected, (state, action) => {
        state.splitDetailsLoading = false;
        state.splitDetailsError = action.error.message;
      })
      
      // Fetch Split Members
      .addCase(fetchSplitMembers.pending, (state) => {
        state.membersLoading = true;
        state.membersError = null;
      })
      .addCase(fetchSplitMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchSplitMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.membersError = action.error.message;
      })
      
      // Fetch Split Balance
      .addCase(fetchSplitBalance.pending, (state) => {
        state.balanceLoading = true;
        state.balanceError = null;
      })
      .addCase(fetchSplitBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchSplitBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.balanceError = action.error.message;
      })
      
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.expensesLoading = true;
        state.expensesError = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expensesLoading = false;
        state.expenses = action.payload.data;
        state.expensesPagination = action.payload.pagination;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.expensesLoading = false;
        state.expensesError = action.error.message;
      })
      
      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searching = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searching = false;
        state.allSearchResults = action.payload;
        state.searchResults = action.payload.slice(0, 6);
        state.hasMoreResults = action.payload.length > 6;
        state.searchPage = 1;
      })
      .addCase(searchUsers.rejected, (state) => {
        state.searching = false;
        state.searchResults = [];
        state.allSearchResults = [];
        state.hasMoreResults = false;
      })
      
      // Create Split
      .addCase(createSplit.pending, (state) => {
        state.createSplitLoading = true;
        state.createSplitError = null;
      })
      .addCase(createSplit.fulfilled, (state, action) => {
        state.createSplitLoading = false;
        state.currentSplit = action.payload;
        state.splits = [action.payload, ...state.splits];
      })
      .addCase(createSplit.rejected, (state, action) => {
        state.createSplitLoading = false;
        state.createSplitError = action.error.message;
      })
      
      // Add Participant
      .addCase(addParticipant.fulfilled, (state, action) => {
        state.currentSplit = action.payload;
      })
      
      // Add Expense
      .addCase(addExpense.fulfilled, (state, action) => {
        state.currentSplit = action.payload;
        // Fetch updated expenses after adding
        if (action.payload.splitId) {
          fetchExpenses(action.payload.splitId);
        }
      })
      
      // Update Expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.currentSplit = action.payload;
        state.editingExpenseId = null;
        state.editedAmount = '';
      })
      
      // Update Payment Status
      .addCase(updatePaymentStatus.pending, (state) => {
        state.paymentStatusLoading = true;
        state.paymentStatusError = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.paymentStatusLoading = false;
        state.paymentStatusError = null;
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.paymentStatusLoading = false;
        state.paymentStatusError = action.error.message;
      })
      
      // Invite Friend
      .addCase(inviteFriend.pending, (state) => {
        state.inviteLoading = true;
        state.inviteError = null;
      })
      .addCase(inviteFriend.fulfilled, (state) => {
        state.inviteLoading = false;
        state.inviteError = null;
      })
      .addCase(inviteFriend.rejected, (state, action) => {
        state.inviteLoading = false;
        state.inviteError = action.error.message;
      });
  },
});

export const {
  setActiveTab,
  setAddParticipantModalVisible,
  setAddExpenseModalVisible,
  setInviteModalVisible,
  setEditingExpenseId,
  setEditedAmount,
  clearSplitState,
  setSearchQuery,
  setSelectedUsers,
  addSelectedUser,
  removeSelectedUser,
  setTempSelectedUsers,
  toggleTempSelectedUser,
  clearTempSelectedUsers,
  loadMoreSearchResults,
  setUserInfo,
} = splitSlice.actions;

export default splitSlice.reducer; 