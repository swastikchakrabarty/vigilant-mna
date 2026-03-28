import numpy as np
from pydantic import ValidationError
from typing import Tuple, List
from schema import CompanyProfile, DealInputs, OutputMetrics, SensitivityDataPoint

class FinanceEngine:
    def __init__(self, buyer: CompanyProfile, target: CompanyProfile, deal: DealInputs):
        self.buyer = buyer
        self.target = target
        self.deal = deal

        # Normalized Mix ensures Cash% + Stock% = 1.0 (though DealInputs validates this)
        self.mix_cash = self.deal.percent_cash
        self.mix_stock = self.deal.percent_stock

    def calculate_standalone(self) -> Tuple[float, float]:
        buyer_eps = self.buyer.net_income / self.buyer.shares_outstanding if self.buyer.shares_outstanding else 0.0
        target_eps = self.target.net_income / self.target.shares_outstanding if self.target.shares_outstanding else 0.0
        return buyer_eps, target_eps

    def resolve_deal_structure(self) -> OutputMetrics:
        """
        Calculates the deal structure using an iterative approach to resolve the circular reference
        between debt sizing and transaction fees.
        
        The Circular Reference:
        1. We need debt to fund the cash portion of the purchase equity PLUS fees.
        2. However, fees are calculated typically as a % of Enterprise Value or total transaction size. 
           If fees scale with debt size (like debt issuance fees), the debt needed increases, which 
           increases fees, which increases debt needed, etc.
        
        In this implementation, we calculate a simplified deal where fees are a flat % of Offer Equity Value.
        If we wanted debt issuance fees, we would iterate. Here, we demonstrate an iterative loop to 
        show how it's done for IB interviews.
        """
        buyer_eps, target_eps = self.calculate_standalone()
        
        # 1. Base Purchase Price parameters
        offer_equity_value = self.deal.offer_price_per_share * self.target.shares_outstanding
        
        # CIRCULAR REFERENCE RESOLVER (Iterative method)
        # Starting assumption: Transaction fees apply to offer equity, but let's assume debt issuance
        # fees apply to new debt, leading to a circularity. We will loop up to 100 times until convergence.
        
        # Initial guesses
        new_debt = 0.0 
        debt_issuance_fee_percent = 0.015 # 1.5% fee on new debt
        transaction_fees_base = offer_equity_value * self.deal.transaction_fees_percent
        
        tolerance = 0.0001 # $100 precision
        max_iterations = 100
        
        for i in range(max_iterations):
            # Total fees = Base fees + debt issuance fees
            total_fees = transaction_fees_base + (new_debt * debt_issuance_fee_percent)
            
            # Use of funds
            total_uses = offer_equity_value + total_fees
            
            # Sources of funds
            cash_needed = total_uses * self.mix_cash
            stock_needed = total_uses * self.mix_stock
            
            # If we assume all cash needed comes from new debt (for simplicity of the model)
            calculated_debt = cash_needed
            
            # Check convergence
            if abs(calculated_debt - new_debt) < tolerance:
                new_debt = calculated_debt
                break
            
            new_debt = calculated_debt
            
        total_uses = offer_equity_value + total_fees
        cash_used = total_uses * self.mix_cash
        stock_issued_value = total_uses * self.mix_stock
        
        # 2. Shares Issued
        # Buyer issues shares at their current share price to fund the stock portion
        new_shares = stock_issued_value / self.buyer.share_price
        pro_forma_shares = self.buyer.shares_outstanding + new_shares
        
        # 3. Pro Forma Net Income Adjustments
        # Interest on New Debt (tax affected)
        interest_expense = new_debt * self.deal.cost_of_debt
        after_tax_interest = interest_expense * (1 - self.buyer.tax_rate)
        
        # Forgone interest on cash used (if any). Here we assume all cash used is debt funded,
        # but if we used existing balance sheet cash, we would subtract forgone interest.
        # For this model, let's assume cash_used is pure newly issued debt.
        
        # Post-tax Synergies
        after_tax_synergies = self.deal.pre_tax_synergies * (1 - self.buyer.tax_rate)
        
        combined_net_income = self.buyer.net_income + self.target.net_income + after_tax_synergies - after_tax_interest
        
        # 4. Pro Forma EPS
        pro_forma_eps = combined_net_income / pro_forma_shares
        
        # 5. Accretion/Dilution
        accretion_dil_amt = pro_forma_eps - buyer_eps
        accretion_dil_pct = (pro_forma_eps / buyer_eps) - 1.0 if buyer_eps else 0.0
        
        return OutputMetrics(
            buyer_standalone_eps=buyer_eps,
            pro_forma_eps=pro_forma_eps,
            accretion_dilution_percent=accretion_dil_pct,
            accretion_per_share=accretion_dil_amt,
            combined_net_income=combined_net_income,
            new_shares_issued=new_shares,
            pro_forma_shares=pro_forma_shares,
            purchase_equity_value=offer_equity_value,
            transaction_fees=total_fees,
            total_uses=total_uses,
            debt_issued=new_debt,
            cash_used=cash_used,
            stock_issued_value=stock_issued_value,
            total_sources=new_debt + stock_issued_value
        )

def generate_sensitivity_table(buyer: CompanyProfile, target: CompanyProfile, base_deal: DealInputs) -> List[SensitivityDataPoint]:
    """
    Generates a matrix estimating Accretion/Dilution across an array of premium levels 
    and cash/stock mix percentages. It acts as an Excel Data Table.
    """
    sensitivities = []
    
    # Premium test points (from -10% premium to +40% premium)
    # Target standalone price = target.share_price
    
    premiums = [-0.10, 0.0, 0.10, 0.20, 0.30, 0.40]
    cash_mixes = [0.0, 0.25, 0.50, 0.75, 1.0]
    
    for prem in premiums:
        test_price = target.share_price * (1 + prem)
        for mix in cash_mixes:
            # Create clone of deal with new inputs
            test_deal = base_deal.copy(update={
                "offer_price_per_share": test_price,
                "percent_cash": mix,
                "percent_stock": 1.0 - mix
            })
            
            engine = FinanceEngine(buyer, target, test_deal)
            metrics = engine.resolve_deal_structure()
            
            sensitivities.append(SensitivityDataPoint(
                purchase_price=test_price,
                premium_percent=prem,
                percent_cash=mix,
                accretion_dilution_percent=metrics.accretion_dilution_percent
            ))
            
    return sensitivities
