/**
 * 入力データの型定義
 */
export interface Entry {
  dateTime: Date; // 入力された日時
  flow: number;   // 流量 (L/min)
  fio2: number;   // FiO2 (%) - FiO2モード有効時のみ意味を持つ (デフォルトは21)
}