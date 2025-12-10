export class DateUtil {
  static formatBillingPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  static parseBillingPeriod(billingPeriod: string): { year: number; month: number } {
    const [year, month] = billingPeriod.split('-').map(Number);
    return { year, month };
  }

  static getBillingPeriodStart(billingPeriod: string): Date {
    const { year, month } = this.parseBillingPeriod(billingPeriod);
    return new Date(year, month - 1, 1);
  }

  static getBillingPeriodEnd(billingPeriod: string): Date {
    const { year, month } = this.parseBillingPeriod(billingPeriod);
    return new Date(year, month, 0, 23, 59, 59, 999);
  }
}

