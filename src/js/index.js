require("@babel/polyfill");
import Search from "./model/Search";
import { elements, renderLoader, clearLoader } from "./view/base";
import * as searchView from "./view/searchView";
import Recipe from "./model/Recipe";
import List from "./model/List";
import Like from "./model/Like";
import * as likesView from "./view/likesView";
import * as listView from "./view/listView";
import {
  renderRecipe,
  clearRecipe,
  highlightSelectedRecipe,
} from "./view/recipeView";

/**
 * Web app төлөв
 * - Хайлтын query, үр дүн
 * - Тухайн үзүүлж байгаа жор
 * - Лайкласан жорууд
 * - Захиалж байгаа жорын найрлага
 */

const state = {};

const controlSearch = async () => {
  // 1) Вэбээс хайлтын түлхүүр үгийг гаргаж авна.
  const query = searchView.getInput();

  if (query) {
    // 2) Шинээр хайлтын обьектийг үүсгэж өгнө.
    state.search = new Search(query);
    // 3) Хайлт хийхэд зориулж дэлгэцийг UI бэлтгэнэ.
    searchView.clearSearchQuery();
    searchView.clearSearchResult();
    renderLoader(elements.searchResultDiv);

    // 4) Хайлтыг гүйцэтгэнэ
    await state.search.doSearch();
    // 5) Хайлтын үр дүнг дэлгэцэнд үзүүлнэ.
    clearLoader();
    if (state.search.result === undefined) alert("Хайлтаар жор олдсонгүй!!!");
    else searchView.renderRecipes(state.search.result);
  }
};

elements.searhForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.pageButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const gotoPageNumber = parseInt(btn.dataset.goto, 10);
    searchView.clearSearchResult();
    searchView.renderRecipes(state.search.result, gotoPageNumber);
  }
});

/**
 * Жорын контроллер
 */
const controlRecipe = async () => {
  // 1) URL-аас ID-ийг салгаж авна
  const id = window.location.hash.replace("#", "");
  // URL дээр ID байгаа эсэхийг шалгана
  if (id) {
    // 2) Жорын моделийг үүсгэж өгнө.
    state.recipe = new Recipe(id);
    // 3) UI дэлгэцийг бэлтгэнэ.
    clearRecipe();
    renderLoader(elements.recipeDiv);
    highlightSelectedRecipe(id);
    // 4) Жороо татаж авчирна.
    await state.recipe.getRecipe();
    // 5) Жорыг гүйцэтгэх хугацаа болон орцыг тооцоолно
    clearLoader();
    state.recipe.calcTime();
    state.recipe.calcHuniiToo();
    // 6) Жороо дэлгэцэнд гаргана
    renderRecipe(state.recipe, state.likes.isLiked(id));
  }
};
// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);
["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

window.addEventListener("load", (e) => {
  // Шинээр лайк моделийг апп дөнгөж ачаалагдахад үүсгэнэ
  if (!state.likes) state.likes = new Like();

  // Дөнгөж эхэлж байхад Like цэсийг дэлгэцэнд гаргах эсэхийг шийдэх
  likesView.toggleLikeMenu(state.likes.getNumberOfLikes());

  // Лайкууд байвал тэдгээрийг цэсэнд нэмж харуулна.
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

/**
 * Найрлаганы контроллер
 */
const controlList = () => {
  // 1) Орцны моделийг үүсгэнэ
  state.list = new List();
  // Өмнө нь харагдаж байсан орцнуудыг дэлгэцнээс устгаж цэвэрлэнэ
  listView.clearItems();
  // 2) Уг модел рүү одоо харагдаж байгаа жорны бүх орцыг авч хийнэ.
  state.recipe.ingredients.forEach((orts) => {
    // Тухайн орцыг модел рүү хийнэ.
    const item = state.list.addItem(orts);
    // Тухайн орцыг дэлгэцэнд гаргана.
    listView.renderItem(item);
  });
};

/**
 * Like контроллер
 */
const controlLike = () => {
  // 1) Like-н моделийг үүсгэнэ
  if (!state.likes) state.likes = new Like();
  // 2) Одоо харагдаж байгаа жорын ID-ыг олж авах
  const currentRecipeId = state.recipe.id;
  // 3) Энэ жорыг лайкласан эсэхийг шалгах
  if (state.likes.isLiked(currentRecipeId)) {
    // 4) Лайкласан бол лайкийг нь болиулна
    state.likes.deleteLike(currentRecipeId);
    // Лайкын цэснээс устгана
    likesView.deleteLike(currentRecipeId);
    // Лайк товчны лайкласан байдлыг алга болгоно
    likesView.toggleLikeBtn(false);
  } else {
    // 5) Лайклаагүй бол лайклана
    const newLike = state.likes.addLike(
      currentRecipeId,
      state.recipe.title,
      state.recipe.publisher,
      state.recipe.image_url
    );
    likesView.renderLike(newLike);
    likesView.toggleLikeBtn(true);
  }

  likesView.toggleLikeMenu(state.likes.getNumberOfLikes());
};

elements.recipeDiv.addEventListener("click", (e) => {
  if (e.target.matches(".recipe__btn, .recipe__btn *")) {
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    controlLike();
  }
});

elements.shoppingList.addEventListener("click", (e) => {
  // Click хийсэн li элементийн data-itemid аттрибутыг шүүж гаргаж авах
  const id = e.target.closest(".shopping__item").dataset.itemid;

  // Олдсон ID-тай орцыг моделоос устгана.
  state.list.deleteItem(id);

  // Дэлгэцнээс ийм ID-тай орцыг олж бас устгана.
  listView.deleteItem(id);
});
