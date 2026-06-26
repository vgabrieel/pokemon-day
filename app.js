const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const app = express();

// Conexão com o MongoDB

require("dotenv").config();
const uri = process.env.URI;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let usuarios;

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    const db = client.db("meubanco");
    usuarios = db.collection("usuarios");

    console.log("MongoDB conectado!");

    app.listen(3000, () => {
      console.log("Servidor executando na porta 3000");
    });

  } catch (erro) {
    console.error(erro);
  }
}

run();

// EJS

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Rota raíz

app.get("/", async (req, res) => {
  try {
    const data = new Date();

    const pokemonId =
      ((data.getUTCFullYear() * 10000 + (data.getUTCMonth() + 1) * 100 + data.getUTCDate()) % 1025) + 1;

    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
    );

    const speciesResponse = await axios.get(
      `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
    );

    const descricao = speciesResponse.data.flavor_text_entries.find(
      entry => entry.language.name === "en"
    )?.flavor_text;

    res.render("index", {
      pokemon: response.data,
      descricao
    });

  } catch (error) {
    console.log(error);
    res.send("Erro ao buscar Pokémon");
  }
});

// Cadastro

app.get("/cadastro", (req, res) => {
  res.render("cadastro");
});

app.post("/cadastro", async (req, res) => {
  const { nome, email, senha, nascimento } = req.body;

  const senhaHash = await bcrypt.hash(senha, 10);

  const resultado = await usuarios.insertOne({
    nome,
    email,
    senha: senhaHash,
    nascimento
  });

  res.redirect(`/perfil/${resultado.insertedId}`);
});

// Login

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = await usuarios.findOne({ email });

  if (!user) {
    return res.send("Usuário não encontrado");
  }

  const senhaCorreta = await bcrypt.compare(
    senha,
    user.senha
  );

  if (!senhaCorreta) {
    return res.send("Senha incorreta");
  }

  res.redirect(`/perfil/${user._id}`);
});

// Rota usuário

app.get("/perfil/:id", async (req, res) => {
  try {
    const usuario = await usuarios.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!usuario) {
      return res.send("Usuário não encontrado");
    }

    const data = new Date(usuario.nascimento);

    const nascimentoFormatado =
      String(data.getUTCDate()).padStart(2, "0") + "/" +
      String(data.getUTCMonth() + 1).padStart(2, "0") + "/" +
      data.getUTCFullYear();

    const pokemonId =
      ((data.getUTCFullYear() * 10000 + (data.getUTCMonth() + 1) * 100 + data.getUTCDate()) % 1025) + 1;

    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
    );

    const speciesResponse = await axios.get(
      `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
    );

    const descricao = speciesResponse.data.flavor_text_entries.find(
      entry => entry.language.name === "en"
    )?.flavor_text;

    res.render("perfil", {
      usuario,
      nascimentoFormatado,
      pokemon: response.data,
      descricao
    });

  } catch (error) {
    console.error(error);
    res.send("Erro ao carregar perfil");
  }
});
