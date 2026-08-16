export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type TransactionsStackParamList = {
  TransactionsList: undefined;
  TransactionForm: { transactionId?: string } | undefined;
};

export type AccountsStackParamList = {
  AccountsList: undefined;
  AccountForm: { accountId?: string } | undefined;
  TransferForm: undefined;
};

export type BudgetsStackParamList = {
  BudgetsList: undefined;
  BudgetForm: { budgetId?: string; categoryId?: string | null } | undefined;
};

export type DebtsStackParamList = {
  DebtsList: undefined;
  DebtForm: { debtId?: string } | undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CategoriesList: undefined;
  CategoryForm: { categoryId?: string; type?: 'income' | 'expense' } | undefined;
  ExportScreen: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  TransactionsTab: undefined;
  BudgetsTab: undefined;
  DebtsTab: undefined;
  AccountsTab: undefined;
  SettingsTab: undefined;
};
