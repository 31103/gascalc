/**
 * 入力データの型定義
 */
export interface Entry {
  dateTime: BillingDateTime; // レセプト月内の論理日時
  flow: number; // 流量 (L/min)
  fio2: number; // FiO2 (%) - FiO2 モード有効時のみ意味を持つ (デフォルトは 21)
  editing?: boolean; // 編集中フラグ (in-place 編集用、デフォルトは false)
}

export interface BillingDateTime {
  day: number;
  hour: number;
  minute: number;
}
