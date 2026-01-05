import AIAssistant from './pages/AIAssistant';
import BankConnections from './pages/BankConnections';
import BankConnectionsNew from './pages/BankConnectionsNew';
import Content from './pages/Content';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ManageBankAccounts from './pages/ManageBankAccounts';
import NotificationSettings from './pages/NotificationSettings';
import RecurringExpenses from './pages/RecurringExpenses';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import UploadStatement from './pages/UploadStatement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "BankConnections": BankConnections,
    "BankConnectionsNew": BankConnectionsNew,
    "Content": Content,
    "Dashboard": Dashboard,
    "Home": Home,
    "ManageBankAccounts": ManageBankAccounts,
    "NotificationSettings": NotificationSettings,
    "RecurringExpenses": RecurringExpenses,
    "Reports": Reports,
    "Transactions": Transactions,
    "UploadStatement": UploadStatement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};