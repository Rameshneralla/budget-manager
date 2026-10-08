/** Confirms that ids sent by the client point to existing lookup rows. */
const lookupRepository = require('../repositories/lookupRepository');
const { ValidationError } = require('../utils/errors');

function assertCategoryExists(categoryId) {
  if (!lookupRepository.categoryExists(categoryId)) {
    throw new ValidationError({ categoryId: 'Please select a valid category.' });
  }
}

function assertPaymentMethodExists(paymentMethodId) {
  if (!lookupRepository.paymentMethodExists(paymentMethodId)) {
    throw new ValidationError({ paymentMethodId: 'Please select a valid payment method.' });
  }
}

module.exports = { assertCategoryExists, assertPaymentMethodExists };
