const FormattedAmount = ({ amount }) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  };
  
  export default FormattedAmount;
  