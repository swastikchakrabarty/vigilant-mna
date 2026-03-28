from pydantic import BaseModel, Field

class CompanyProfile(BaseModel):
    name: str = Field(..., description="Name of the company")
    share_price: float = Field(..., description="Current share price ($)")
    shares_outstanding: float = Field(..., description="Shares outstanding (millions)")
    net_income: float = Field(..., description="LTM or Projected consensus Net Income ($m)")
    tax_rate: float = Field(0.21, description="Corporate tax rate (default is 21%)")

    @property
    def equity_value(self) -> float:
        return self.share_price * self.shares_outstanding

class DealInputs(BaseModel):
    offer_price_per_share: float = Field(..., description="Offer price for the target company per share ($)")
    percent_cash: float = Field(..., ge=0, le=1, description="Percentage of the deal funded by cash (0 to 1)")
    percent_stock: float = Field(..., ge=0, le=1, description="Percentage of the deal funded by stock (0 to 1)")
    
    # Financing terms
    cost_of_debt: float = Field(0.06, description="Pre-tax interest rate on newly issued debt to fund the cash portion")
    yield_on_cash: float = Field(0.02, description="Pre-tax interest rate on cash reserves used for the deal")
    
    # Synergies and Fees
    pre_tax_synergies: float = Field(0.0, description="Estimated pre-tax synergies ($m)")
    transaction_fees_percent: float = Field(0.02, description="IB & transaction fees as a % of Equity Value")

    @property
    def total_mix(self) -> float:
        return self.percent_cash + self.percent_stock

class OutputMetrics(BaseModel):
    buyer_standalone_eps: float
    pro_forma_eps: float
    accretion_dilution_percent: float
    accretion_per_share: float
    
    combined_net_income: float
    new_shares_issued: float
    pro_forma_shares: float
    
    # Sources / Uses metrics
    purchase_equity_value: float
    transaction_fees: float
    total_uses: float
    
    debt_issued: float
    cash_used: float
    stock_issued_value: float
    total_sources: float

class SensitivityDataPoint(BaseModel):
    purchase_price: float
    premium_percent: float
    percent_cash: float
    accretion_dilution_percent: float

class DealResponse(BaseModel):
    metrics: OutputMetrics
    sensitivities: list[SensitivityDataPoint]
