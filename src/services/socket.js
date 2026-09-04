import { io } from 'socket.io-client';
import { API_URL } from '../config';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(token) {
        if (!this.socket) {
            this.socket = io(API_URL, {
                auth: { token },
                withCredentials: true,
            });
            
            this.socket.on('connect', () => {
                console.log('Socket connected');
            });
            
            this.socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

const socketService = new SocketService();
export default socketService;
