export interface ArticleTagModel {
  key: string
  label: string
  colorParams: string
}

export type ArticleTagProps =
  | { create: true; model?: ArticleTagModel }
  | { create?: false; model: ArticleTagModel }
