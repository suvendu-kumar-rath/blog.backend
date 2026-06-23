/**
 * Compare plain text password with stored password
 * @param {string} plainPassword - Plain text password
 * @param {string} storedPassword - Stored password from database
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (plainPassword, storedPassword) => {
  try {
    return plainPassword === storedPassword;
  } catch (error) {
    throw new Error(`Error comparing passwords: ${error.message}`);
  }
};

module.exports = {
  comparePassword
};
