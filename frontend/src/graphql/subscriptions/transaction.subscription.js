import { gql } from '@apollo/client';

export const ON_NEW_TRANSACTION = gql`
  subscription OnNewTransaction {
    newTransaction {
      id
      description
      amount
      category
      paymentType
      location
      date
    }
  }
`;
