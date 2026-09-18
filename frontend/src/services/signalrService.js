import * as signalR from '@microsoft/signalr';

class SignalRService {
    constructor() {
        this.connection = null;
    }

    startConnection(auctionId) {
        if (this.connection) {
            return Promise.resolve();
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl('http://localhost:5110/auctionHub')
            .withAutomaticReconnect()
            .build();

        return this.connection.start()
            .then(() => {
                console.log('SignalR Connected.');
                if (auctionId) {
                    this.connection.invoke('JoinAuctionGroup', auctionId.toString())
                        .catch(err => console.error('Error joining group: ', err));
                }
            })
            .catch(err => console.error('Error connecting to SignalR: ', err));
    }

    stopConnection(auctionId) {
        if (this.connection) {
            if (auctionId) {
                this.connection.invoke('LeaveAuctionGroup', auctionId.toString())
                    .catch(err => console.error('Error leaving group: ', err));
            }
            this.connection.stop().then(() => {
                this.connection = null;
            });
        }
    }

    onReceiveBid(callback) {
        if (this.connection) {
            this.connection.on('ReceiveBid', callback);
        }
    }

    offReceiveBid(callback) {
        if (this.connection) {
            this.connection.off('ReceiveBid', callback);
        }
    }

    onAuctionExtended(callback) {
        if (this.connection) {
            this.connection.on('AuctionExtended', callback);
        }
    }

    offAuctionExtended(callback) {
        if (this.connection) {
            this.connection.off('AuctionExtended', callback);
        }
    }
}

export const signalRService = new SignalRService();
