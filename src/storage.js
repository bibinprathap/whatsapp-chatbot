import { db } from './db.js';

/**
 * Get user state from database
 * Returns default state if user doesn't exist
 */
export function getState(phoneNumber) {
  try {
    const row = db.prepare('SELECT * FROM user_state WHERE phone_number = ?').get(phoneNumber);
    
    if (row) {
      return {
        phone_number: row.phone_number,
        stage: row.stage,
        ...JSON.parse(row.state_data || '{}'),
      };
    }
  } catch (error) {
    console.error(`Error getting state for ${phoneNumber}:`, error);
  }

  // Return default state for new users
  return {
    phone_number: phoneNumber,
    stage: 0,
    itens: [],
    address: '',
  };
}

/**
 * Save user state to database
 */
export function setState(phoneNumber, state) {
  try {
    const { stage, ...stateData } = state;
    const now = Date.now();

    const existing = db.prepare('SELECT phone_number FROM user_state WHERE phone_number = ?').get(phoneNumber);

    if (existing) {
      db.prepare(
        `UPDATE user_state SET stage = ?, state_data = ?, last_updated_at = ? WHERE phone_number = ?`
      ).run(stage, JSON.stringify(stateData), now, phoneNumber);
    } else {
      db.prepare(
        `INSERT INTO user_state (phone_number, stage, state_data, last_updated_at) VALUES (?, ?, ?, ?)`
      ).run(phoneNumber, stage, JSON.stringify(stateData), now);
    }
  } catch (error) {
    console.error(`Error setting state for ${phoneNumber}:`, error);
  }
}

/**
 * Get all users currently in specific stages
 */
export function getUsersByStage(stages) {
  try {
    const placeholders = stages.map(() => '?').join(',');
    const query = `SELECT phone_number FROM user_state WHERE stage IN (${placeholders})`;
    return db.prepare(query).all(...stages);
  } catch (error) {
    console.error('Error getting users by stage:', error);
    return [];
  }
}

/**
 * Get abandoned carts (users in specific stages with old activity)
 */
export function getAbandonedCarts(stageList, timeThreshold) {
  try {
    const placeholders = stageList.map(() => '?').join(',');
    const query = `
      SELECT phone_number FROM user_state
      WHERE stage IN (${placeholders})
      AND last_updated_at < ?
    `;
    return db.prepare(query).all(...stageList, timeThreshold);
  } catch (error) {
    console.error('Error getting abandoned carts:', error);
    return [];
  }
}

export { db };
