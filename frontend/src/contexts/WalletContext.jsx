import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../services/api';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const [balance, setBalance] = useState({
        totalAmount: 0,
        retainedAmount: 0,
        availableAmount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBalance = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchWithAuth('/wallets/balance');
            setBalance(data);
        } catch (err) {
            setError('Error al obtener el saldo: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            const data = await fetchWithAuth('/wallets/transactions');
            setTransactions(data);
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
                body: JSON.stringify({ amount })
            });
            setBalance(data);
            await fetchTransactions();
        } catch (err) {
            setError('Error al depositar: ' + err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Load initial data
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchBalance();
            fetchTransactions();
        }
    }, [fetchBalance, fetchTransactions]);

    return (
        <WalletContext.Provider value={{
            balance,
            transactions,
            isLoading,
            error,
            deposit,
            fetchBalance,
            fetchTransactions
        }}>
            {children}
        </WalletContext.Provider>
    );
};
