package com.project.ecommerce.modules.payment.projection;

import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import java.math.BigDecimal;

public interface PaymentProviderSummary {
    PaymentProvider getProvider();
    long getCount();
    BigDecimal getAmount();
}
