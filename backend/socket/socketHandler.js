const db = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User Connected:', socket.id);

        socket.on('join-room', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined private room user_${userId}`);
        });

        socket.on('send-chat', async (msg) => {
            const { sender_id, receiver_id, content, latitude, longitude } = msg;
            try {
                const [result] = await db.execute(
                    `INSERT INTO messages (sender_id, receiver_id, content, latitude, longitude, is_read, sent_at) 
                     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
                    [sender_id, receiver_id, content, latitude || null, longitude || null]
                );
                io.to(`user_${receiver_id}`).emit('receive-chat', {
                    id: result.insertId, sender_id, receiver_id, content, latitude, longitude,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: false
                });
            } catch (err) {
                console.error("SQL Insert Error:", err);
            }
        });

        socket.on('share-location', (data) => {
            socket.broadcast.emit('friend-moved', data);
        });

        socket.on('send-pose-alert', async (data) => {
            const { sessionId, issueType, feedbackText, userId } = data;
            try {
                await db.execute(
                    `INSERT INTO posture_alerts (session_id, issue_type, feedback_text) VALUES (?, ?, ?)`,
                    [sessionId, issueType, feedbackText]
                );
                io.to(`user_${userId}`).emit('new-clinical-insight', {
                    text: feedbackText, type: issueType, time: new Date().toLocaleTimeString()
                });
            } catch (err) {
                console.error("Alert Save Error:", err);
            }
        });

        socket.on('disconnect', () => console.log('User disconnected'));
    });
};