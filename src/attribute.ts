import { Feature } from "./tilecache";

export class StringAttr {
  str: string | ((z: number, f?: Feature) => string);
  per_feature: boolean;

  constructor(c: any, defaultValue: string = "") {
    this.str = c || defaultValue;
    this.per_feature = typeof this.str == "function" && this.str.length == 2;
  }

  public get(z: number, f?: Feature): string {
    if (typeof this.str == "function") {
      return this.str(z, f);
    } else {
      return this.str;
    }
  }
}

export class NumberAttr {
  value: number | ((z: number, f?: Feature) => number);
  per_feature: boolean;

  constructor(c: any, defaultValue: number = 1) {
    this.value = c !== undefined && c !== null ? c : defaultValue;
    this.per_feature =
      typeof this.value == "function" && this.value.length == 2;
  }

  public get(z: number, f?: Feature): number {
    let value;
    if (typeof this.value == "function") {
      value = this.value(z, f);
    } else {
      value = this.value;
    }

    return value;
  }
}

export class TextAttr {
  label_props: string[] | ((z: number, f?: Feature) => string[]);
  textTransform: string | ((z: number, f?: Feature) => string);
  value?: (z: number, f?: Feature) => string;

  constructor(options: any = {}) {
    this.label_props = options.label_props || ["name"];
    this.textTransform = options.textTransform;
    this.value = options.value;
  }

  public get(z: number, f: Feature): string {
    var retval;

    if (this.value) {
      retval = this.value(z, f);
    } else {
      var label_props: string[];
      if (typeof this.label_props == "function") {
        label_props = this.label_props(z, f);
      } else {
        label_props = this.label_props;
      }
      for (let property of label_props) {
        if (f.props.hasOwnProperty(property)) {
          retval = f.props[property];
          if (typeof retval === "number") retval = `${retval}`;
          break;
        }
      }
    }
    let transform;
    if (typeof this.textTransform === "function") {
      transform = this.textTransform(z, f);
    } else {
      transform = this.textTransform;
    }
    if (retval && transform === "uppercase") retval = retval.toUpperCase();
    else if (retval && transform === "lowercase") retval = retval.toLowerCase();
    else if (retval && transform === "capitalize") {
      const wordsArray = retval.toLowerCase().split(" ");
      const capsArray = wordsArray.map((word: string) => {
        return word[0].toUpperCase() + word.slice(1);
      });
      retval = capsArray.join(" ");
    }
    return retval;
  }
}

export class FontAttr {
  family?: string | ((z: number, f: Feature) => string);
  size?: number | ((z: number, f: Feature) => number);
  weight?: number | ((z: number, f: Feature) => number);
  style?: number | ((z: number, f: Feature) => string);
  font?: string | ((z: number, f: Feature) => string);

  constructor(options: any) {
    if (options.font) {
      this.font = options.font;
    } else {
      this.family = options.fontFamily || "sans-serif";
      this.size = options.fontSize || 12;
      this.weight = options.fontWeight;
      this.style = options.fontStyle;
    }
  }

  public get(z: number, f: Feature) {
    if (this.font) {
      if (typeof this.font === "function") {
        return this.font(z, f);
      } else {
        return this.font;
      }
    } else {
      var style = "";
      if (this.style) {
        if (typeof this.style === "function") {
          style = this.style(z, f) + " ";
        } else {
          style = this.style + " ";
        }
      }

      var weight = "";
      if (this.weight) {
        if (typeof this.weight === "function") {
          weight = this.weight(z, f) + " ";
        } else {
          weight = this.weight + " ";
        }
      }

      var size;
      if (typeof this.size === "function") {
        size = this.size(z, f);
      } else {
        size = this.size;
      }

      var family;
      if (typeof this.family === "function") {
        family = this.family(z, f);
      } else {
        family = this.family;
      }

      return `${style}${weight}${size}px ${family}`;
    }
  }
}

export class ArrayAttr {
  value:
    | string[]
    | number[]
    | ((z: number, f?: Feature) => string[] | number[]);
  per_feature: boolean;

  constructor(c: any, defaultValue: number[] = []) {
    this.value = c || defaultValue;
    this.per_feature =
      typeof this.value == "function" && this.value.length == 2;
  }

  public get(z: number, f?: Feature): string[] | number[] {
    if (typeof this.value == "function") {
      return this.value(z, f);
    } else {
      return this.value;
    }
  }
}
