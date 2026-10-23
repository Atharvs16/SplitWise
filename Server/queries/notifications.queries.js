const db = require('../config/db');

async function getNotifications(userId) {
    try{
        const query = `SELECT * FROM notifications WHERE user_id = $1 `
    }
    catch(error){
        console.log(error);
        throw error;
    }
}