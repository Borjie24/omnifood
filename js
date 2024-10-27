computed: {
  /**
   * Retrieves the current user's account.
   * @return {Object|null} The account details if logged in, else null.
   */
  userAccount() {
    return this.showUserAccount
  },

  /**
   * Generates a welcome message for the user.
   * @return {string|null} Welcome message if the user is logged in, otherwise null.
   */
  landingMessage() {
    return this.showUserAccount
      ? `Welcome, ${this.showUserAccount.owner}`
      : null
  },

  /**
   * Retrieves and optionally sorts the user's transactions.
   * @return {Array} Sorted or unsorted transactions list.
   */
  userTransaction() {
    const transaction = this.userAccount.movements.slice()
    return this.sortedTransactions
      ? transaction.sort((deposit, withdraw) => deposit - withdraw)
      : transaction
  },

  /**
   * Calculates the user's account balance.
   * @return {string} The formatted balance as a currency string.
   */
  userBalance() {
    if (!this.userAccount) {
      return '₱0.00'
    }
    const amountOfTransaction = this.userAccount.movements.reduce(
      (user, transaction) => user + transaction,
      0,
    )
    return this.getUserCurrency(amountOfTransaction)
  },

  /**
   * Formats the current date for the balance summary.
   * @return {string} Formatted date string.
   */
  currentBalanceDate() {
    const today = new Date()
    return new Intl.DateTimeFormat(this.userAccount.locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(today)
  },

  /**
   * Calculates the total inflow amount.
   * @return {string} The formatted total inflow as a currency string.
   */
  summaryIn() {
    const totalInflow = this.userAccount.movements
      .filter(amount => amount > 0)
      .reduce((total, amount) => total + amount, 0)

    return this.getUserCurrency(totalInflow)
  },

  /**
   * Calculates the total outflow amount.
   * @return {string} The formatted total outflow as a currency string.
   */
  summaryOut() {
    const totalOutflow = this.userAccount.movements
      .filter(amount => amount < 0)
      .reduce((total, amount) => total + amount, 0)

    return this.getUserCurrency(Math.abs(totalOutflow))
  },

  /**
   * Calculates the total interest earned based on deposits and interest rate.
   * @return {string} The formatted total interest as a currency string.
   */
  summaryInterest() {
    const totalInterest = this.userAccount.movements
      .filter(amount => amount > 0)
      .map(deposit => (deposit * this.userAccount.interestRate) / 100)
      .reduce((total, interest) => total + interest, 0)

    return this.getUserCurrency(totalInterest)
  },

  /**
   * Retrieves the user's current balance.
   * @return {number} The total balance.
   */
  userCurrentBalance() {
    return this.showUserAccount.movements.reduce(
      (total, amount) => total + amount,
      0,
    )
  },

  /**
   * Formats the remaining login timer.
   * @return {string} The remaining time in "MM:SS" format.
   */
  loginTimer() {
    const min = String(Math.floor(this.remainingTime / 60)).padStart(2, '0')
    const sec = String(this.remainingTime % 60).padStart(2, '0')
    return `${min}:${sec}`
  },
},

methods: {
  /**
   * Sets the active tab for the application.
   * @param {string} tab - The tab identifier to set as active.
   */
  setActiveTab(tab) {
    this.activeTab = tab
  },

  /**
   * Handles user login by validating credentials and setting the account state.
   */
  loginUserAccount() {
    this.loading = true
    const userAccount = this.userAccounts.find(
      user =>
        user.owner
          .toLowerCase()
          .split(' ')
          .map(name => name[0])
          .join('') === this.userLogin,
    )
    setTimeout(() => {
      if (userAccount?.pin === +this.userPin) {
        this.showUserAccount = userAccount
        this.startLogOutTimer()
      } else {
        alert('No credentials recorded, Please try again')
      }
      this.loading = false
    }, 2000)
  },

  /**
   * Formats a given amount into the user's currency format.
   * @param {number} money - The amount to format.
   * @return {string} The formatted currency string.
   */
  getUserCurrency(money) {
    return new Intl.NumberFormat(this.userAccount.locale, {
      style: 'currency',
      currency: this.userAccount.currency,
    }).format(money)
  },

  /**
   * Calculates the transaction date relative to today.
   * @param {string} dateOfTransaction - The transaction date string.
   * @return {string} Formatted date or relative days ago.
   */
  getTransactionDate(dateOfTransaction) {
    const transactionDate = new Date(dateOfTransaction)
    const differenceInDays = Math.floor(
      (new Date() - transactionDate) / (1000 * 60 * 60 * 24),
    )
    if (differenceInDays === 0) {
      return 'Today'
    } else if (differenceInDays <= 7) {
      return `${differenceInDays} days ago`
    } else {
      return new Intl.DateTimeFormat(this.userAccount.locale).format(
        transactionDate,
      )
    }
  },

  /**
   * Returns a label for a transaction indicating deposit or withdrawal.
   * @param {number} transaction - The transaction amount.
   * @return {string} Label for transaction type.
   */
  getTransactionLabel(transaction) {
    return transaction > 0
      ? 'movements__type--deposit'
      : 'movements__type--withdrawal'
  },

  /**
   * Transfers money between accounts if conditions are met.
   */
  getTransferMoney() {
    const transferMoney = this.userAccounts.find(
      acc =>
        acc.owner
          .toLowerCase()
          .split(' ')
          .map(name => name[0])
          .join('') === this.transferToAcc,
    )
    if (
      transferMoney &&
      this.amountTransferred > 0 &&
      this.userCurrentBalance >= this.amountTransferred &&
      transferMoney !== this.showUserAccount
    ) {
      this.userAccount.movements.push(-this.amountTransferred)
      transferMoney.movements.push(this.amountTransferred)
      this.showUserAccount.movementsDates.push(new Date().toISOString())
      transferMoney.movementsDates.push(new Date().toISOString())
      this.amountTransferred = 0
      this.remainingTime = 300
      this.transferToAcc = ''
      alert('Transfer Money successfully')
    } else {
      alert(
        "Transfer failed! Insufficient funds or Can't transfer to your own account",
      )
    }
  },

  /**
   * Requests a loan if conditions are met.
   */
  getRequestLoan() {
    if (
      this.amountLoaned > 0 &&
      this.showUserAccount.movements.some(
        movement => movement >= (this.amountLoaned * 10) / 100,
      )
    ) {
      setTimeout(() => {
        this.showUserAccount.movements.push(this.amountLoaned)
        this.showUserAccount.movementsDates.push(new Date().toISOString())
        this.amountLoaned = 0
        this.remainingTime = 300
        this.updateUI()
        alert('Requested loan has been approved')
      }, 2000)
    } else {
      alert('Requested loan has been declined. Please try again next')
    }
  },

  /**
   * Closes the user account if credentials are confirmed.
   */
  getAccountClose() {
    if (
      this.confirmUser === this.userLogin &&
      +this.confirmPin === this.showUserAccount.pin
    ) {
      const index = this.userAccounts.findIndex(
        account => account.owner === this.showUserAccount.owner,
      )
      this.userAccounts.splice(index, 1)
      this.showUserAccount = null
      this.confirmUser = ''
      this.confirmPin = ''
      alert('Your account has been successfully closed.')
    } else {
      alert(
        'Account closure failed! Please check your credentials and try again.',
      )
    }
  },

  /**
   * Forces the UI to re-render.
   */
  updateUI() {
    this.$forceUpdate()
  },

  /**
   * Starts a logout timer, logging the user out when time runs out.
   */
  startLogOutTimer() {
    if (this.time) clearInterval(this.time)
    this.remainingTime = 300
    this.time = setInterval(() => {
      this.remainingTime--
      if (this.remainingTime === 0) {
        clearInterval(this.time)
        this.showUserAccount = null
      }
    }, 1000)
  },

  /**
   * Logs out the user by clearing account-related data.
   */
  clickLogOutButton() {
    this.showUserAccount = null
    this.userLogin = ''
    this.userPin = ''
    this.activeTab = 'one'
  },

  /**
   * Toggles the sorting of transactions.
   */
  sortTransactions() {
    this.sortedTransactions = !this.sortedTransactions
