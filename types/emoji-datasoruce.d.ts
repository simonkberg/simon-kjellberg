declare module "emoji-datasource" {
  interface SkinVariation {
    unified: string;
    non_qualified?: string;
    image: string;
    sheet_x: number;
    sheet_y: number;
    added_in: string;
    has_img_apple: boolean;
    has_img_google: boolean;
    has_img_twitter: boolean;
    has_img_facebook: boolean;
    obsoleted_by?: string;
    obsoletes?: string;
  }

  interface SkinVariations {
    "1F3FB"?: SkinVariation;
    "1F3FC"?: SkinVariation;
    "1F3FD"?: SkinVariation;
    "1F3FE"?: SkinVariation;
    "1F3FF"?: SkinVariation;
    "1F3FB-1F3FB"?: SkinVariation;
    "1F3FB-1F3FC"?: SkinVariation;
    "1F3FB-1F3FD"?: SkinVariation;
    "1F3FB-1F3FE"?: SkinVariation;
    "1F3FB-1F3FF"?: SkinVariation;
    "1F3FC-1F3FB"?: SkinVariation;
    "1F3FC-1F3FC"?: SkinVariation;
    "1F3FC-1F3FD"?: SkinVariation;
    "1F3FC-1F3FE"?: SkinVariation;
    "1F3FC-1F3FF"?: SkinVariation;
    "1F3FD-1F3FB"?: SkinVariation;
    "1F3FD-1F3FC"?: SkinVariation;
    "1F3FD-1F3FD"?: SkinVariation;
    "1F3FD-1F3FE"?: SkinVariation;
    "1F3FD-1F3FF"?: SkinVariation;
    "1F3FE-1F3FB"?: SkinVariation;
    "1F3FE-1F3FC"?: SkinVariation;
    "1F3FE-1F3FD"?: SkinVariation;
    "1F3FE-1F3FE"?: SkinVariation;
    "1F3FE-1F3FF"?: SkinVariation;
    "1F3FF-1F3FB"?: SkinVariation;
    "1F3FF-1F3FC"?: SkinVariation;
    "1F3FF-1F3FD"?: SkinVariation;
    "1F3FF-1F3FE"?: SkinVariation;
    "1F3FF-1F3FF"?: SkinVariation;
  }

  interface Emoji {
    name: string;
    unified: string;
    non_qualified?: string;
    docomo?: string;
    au?: string;
    softbank?: string;
    google?: string;
    image: string;
    sheet_x: number;
    sheet_y: number;
    short_name: string;
    short_names: string[];
    text?: string;
    texts?: string[];
    category: string;
    subcategory: string;
    sort_order: number;
    added_in: string;
    has_img_apple: boolean;
    has_img_google: boolean;
    has_img_twitter: boolean;
    has_img_facebook: boolean;
    skin_variations?: SkinVariations;
    obsoletes?: string;
    obsoleted_by?: string;
  }

  const emojiData: Emoji[];

  export default emojiData;
}
