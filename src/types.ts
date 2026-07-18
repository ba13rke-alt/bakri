/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DailyReturn {
  id: string; // unique ID
  returnNumber: number; // رقم الرد
  date: string; // تاريخ الرد
  netAmount: number; // صافي الرد
  notes?: string; // ملاحظات إضافية
}

export interface BoatExpense {
  id: string;
  type: string; // نوع المصروف (طعام، وقود، ثلج، صيانات، إلخ)
  date: string;
  amount: number; // المبلغ
  notes?: string;
}

export interface SponsorExpense {
  id: string;
  type: string; // نوع المصروف (رواتب، إقامات، رخص، إلخ)
  date: string;
  amount: number; // المبلغ
  notes?: string;
}

export interface Boat {
  id: string; // unique ID
  name: string; // اسم المركب
  licenseNumber?: string; // رقم الترخيص أو السجل الزراعي
  crewCount?: number; // عدد العمالة الاختياري
}

export interface MonthlyRecord {
  id: string; // Year-Month string representation, e.g. "2026-06"
  name: string; // e.g. "يونيو 2026"
  boatId?: string; // ID of the boat this record belongs to
  dailyReturns: DailyReturn[];
  boatExpenses: BoatExpense[];
  sponsorExpenses: SponsorExpense[];
}
