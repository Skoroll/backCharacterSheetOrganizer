const Article = require("../models/articleModel");

// Récupérer tous les articles
exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des articles." });
  }
};

// Créer un article
exports.createArticle = async (req, res) => {
  const { title, subtitle, content, category } = req.body;

  if (!title || !subtitle || !content || !category) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const newArticle = new Article({ title, subtitle, content, category });
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création de l'article." });
  }
};

// Modifier un article
exports.updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, content, category } = req.body;

  try {
    const article = await Article.findById(id);
    if (!article) return res.status(404).json({ message: "Article non trouvé." });

    article.title = title ?? article.title;
    article.subtitle = subtitle ?? article.subtitle;
    article.content = content ?? article.content;
    article.category = category ?? article.category;

    await article.save();

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'article." });
  }
};

// Supprimer un article
exports.deleteArticle = async (req, res) => {
  const { id } = req.params;

  try {
    await Article.findByIdAndDelete(id);
    res.status(200).json({ message: "Article supprimé." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'article." });
  }
};
