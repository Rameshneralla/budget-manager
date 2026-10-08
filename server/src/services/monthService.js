/** Available budget months. Months are created automatically when a record is saved in them. */
const monthRepository = require('../repositories/monthRepository');

function listMonths() {
  return monthRepository.findAllKeys();
}

module.exports = { listMonths };
