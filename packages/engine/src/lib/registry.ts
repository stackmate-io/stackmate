import { SubclassRegistry } from '@stackmate/interfaces';

class Registry<T> implements SubclassRegistry<T> {
  /**
   * @var {Map} items the items in the registry
   */
  items: Map<string, T> = new Map();

  /**
   * Adds a class to the registry
   *
   * @param {Function} classConstructor the class constructor to add
   * @param {Array} attrs any attributes to hash and look up by
   */
  add(classConstructor: T, ...attrs: string[]): void {
    this.items.set(this.hash(attrs), classConstructor);
  }

  /**
   * Returns a class constructor based on a set of attributes
   *
   * @param {Array} attrs the list of attributes to look up the class by
   * @returns {Function} the class constructor
   */
  get(...attrs: string[]): T | undefined {
    return this.items.get(this.hash(attrs));
  }

  /**
   * @param {Array<String>} attrs hashes an array of strings
   * @returns {String} the hashed string
   */
  protected hash(attrs: string[]): string {
    return attrs.map(att => String(att)).join('-');
  }
}

export default Registry;
