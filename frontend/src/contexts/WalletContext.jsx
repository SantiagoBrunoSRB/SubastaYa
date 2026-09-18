import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth, API_BASE_URL } from '../services/api';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

const normalizeBalance = (data) => {
    if (!data) return { totalAmount: 0, retainedAmount: 0, availableAmount: 0 };
    return {
        totalAmount: data.totalBalance !== undefined ? data.totalBalance : (data.totalAmount || 0),
        retainedAmount: data.heldBalance !== undefined ? data.heldBalance : (data.retainedAmount || 0),
        availableAmount: data.availableBalance !== undefined ? data.availableBalance : (data.availableAmount || 0),
    };
};

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState({
        totalAmount: 0,
        retainedAmount: 0,
        availableAmount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');

    const fetchBalance = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth('/wallets/balance');
            setBalance(normalizeBalance(data));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const data = await fetchWithAuth('/wallets/transactions');
            setTransactions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al obtener transacciones:', err);
        }
    }, []);

    const deposit = async (amount) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth('/wallets/deposit', {
                method: 'POST',
                body: JSON.stringify({ amount: Number(amount) })
            });
            setBalance(normalizeBalance(data));
            await fetchTransactions();
        } catch (err) {
            setError('Error al depositar: ' + err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Actualiza el saldo de forma optimista cuando el usuario hace una puja.
     * Retiene `amount` del saldo disponible localmente, sin esperar la confirmación del servidor.
     * Luego fetchBalance() sincroniza con el valor real.
     */
    const applyOptimisticHold = useCallback((amount) => {
        setBalance((prev) => ({
            ...prev,
            retainedAmount: prev.retainedAmount + amount,
            availableAmount: prev.availableAmount - amount,
        }));
    }, []);

    const login = async (email = 'comprador1@test.com', password = 'Password123!') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Error al iniciar sesión');
            }
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.email);
            setIsAuthenticated(true);
            setUserEmail(data.email);
            await fetchBalance();
            await fetchTransactions();
            return data;
        } catch (err) {
            setError('Error al iniciar sesión: ' + err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setIsAuthenticated(false);
        setUserEmail('');
        setBalance({ totalAmount: 0, retainedAmount: 0, availableAmount: 0 });
        setTransactions([]);
    };

    // Load initial data
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchBalance();
            fetchTransactions();
        } else {
            setIsAuthenticated(false);
        }
    }, [fetchBalance, fetchTransactions]);

    return (
        <WalletContext.Provider value={{
            balance,
            transactions,
            isLoading,
            error,
            isAuthenticated,
            userEmail,
            deposit,
            login,
            logout,
            fetchBalance,
            fetchTransactions,
            applyOptimisticHold
        }}>
            {children}
        </WalletContext.Provider>
    );
};
