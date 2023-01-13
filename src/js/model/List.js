import uniqid from "uniqid";
export default class List {
  constructor() {
    this.items = [];
  }

  deleteItem(id) {
    // 1) id гэдэг ID-тай орцын индексийг массиваас хайж олно
    const index = this.items.findIndex((el) => el.id === id);
    // 2) Уг индекс дээрх элементийг массиваас устгана
    this.items.splice(index, 1);
  }

  addItem(item) {
    let newItem = {
      id: uniqid(),
      item, //item: item,
    };
    this.items.push(newItem);

    return newItem;
  }
}
