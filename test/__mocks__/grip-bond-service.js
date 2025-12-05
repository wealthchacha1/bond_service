class MockGripFinanceService {
  constructor() {
    this.getAllBonds = jest.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Test Bond 1",
          interestRate: 7.5,
          effectiveYield: 8.0,
          financeCompanyName: "Test Company",
        },
      ],
    });
    this.calculateBonds = jest.fn().mockResolvedValue({
      assetCalcDetails: {
        purchasePrice: 1000,
        preTaxReturns: 1080,
        maxInvestment: 100000,
        maxLots: 100,
        minLots: 1,
      },
    });
    this.getKYCStatus = jest.fn().mockResolvedValue({ status: "verified" });
    this.getRedirectionUrlForKYC = jest.fn().mockResolvedValue({ redirectUrl: "https://kyc.example.com" });
    this.getCheckoutRedirectUrl = jest.fn().mockResolvedValue("https://checkout.example.com");
    this.createGripUser = jest.fn().mockResolvedValue("test-username");
  }
}

module.exports = {
  GripFinanceService: MockGripFinanceService,
};


