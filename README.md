<h1 align="center">
  
![complete-logo](https://github.com/user-attachments/assets/ff316b5a-2c0f-4c3f-a75b-f70a6b5dc9de)

</h1>

<p align="center">
  <i align="center">An food marketplace for students from schools and universities 🍔</i>
</p>

<h4 align="center">
  <a href="https://github.com/jonathatargino/iffood/graphs/contributors">
    <img src="https://img.shields.io/github/contributors-anon/jonathatargino/iffood?color=yellow&style=flat-square" alt="contributors" style="height: 20px;">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/MIT%20-blue.svg?style=flat-square&label=license" alt="license" style="height: 20px;">
  </a>
  <a href="https://discord.gg/PTkjGrSXBP">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="discord" style="height: 20px;">
</h4>

## Introduction

IF Food is a food marketplace built for schools and colleges, allowing students to list and sell food quickly and easily within their campus.

Currently, the project is limited to the IFCE Maracanaú campus since it is an MVP (Minimum Viable Product). For this reason, the available features are still minimal and focused, aiming to validate the idea and the core user experience before expanding to more campuses and adding new functionality.
Now your live applications will be always up-to-date.

## Development

<details open>
<summary>
Pre-requisites
</summary> <br />
To be able to start development on IF Food, make sure that you have the following prerequisites:

###

- Node.js
- Git
- Docker (only to run tests, due [testcontainers](https://testcontainers.com/))
- Supabase Project
- S3 Bucket
</details>

<details open>
<summary>
Running IF Food
</summary> <br />

This repository contains **both the API (backend)** and the **Web App (frontend)** in the same workspace.  
Follow the steps below to run the full project locally.


1. Clone the repository and install dependencies

This project is split into two folders:

- `iffood-api` → backend (API)
- `iffood-front` → frontend (Web)

Run the command below to clone the repository and install dependencies in both projects:

```shell
git clone https://github.com/jonathatargino/iffood.git && cd ./iffood/iffood-api && npm install && cd ../iffood-front && npm install
```

2. Add environment variables

Before running the project, you must configure the environment variables for both backend and frontend.

Backend (iffood-api)

Create a .env file inside iffood-api/:

```
cd iffood-api
cp .env.example .env
```

Frontend (iffood-front)

Create a .env file inside iffood-front/:

```
cd ../iffood-front
cp .env.example .env
```

3. Apply database migrations

```
npm run migration:run
```

4. Finally running

Backend (iffood-api)

```
npm run dev
```

Frontend (iffood-front)

```
npm run dev
```

Happy hacking! 👾

</details>

## Resources

- **[Website](https://iffood.com.br)** overview of the product.
- **[API Docs](https://iffood.com.br/api/docs)** for comprehensive documentation.
- **[Discord](https://discord.gg/PTkjGrSXBP)** for support and discussions with the community and the team.
- **[GitHub](https://github.com/jonathatargino/iffood)** for source code, issues, and pull requests.

<a name="contributing_anchor"></a>
## Contributing

IF Food code is open-source. We are committed to a transparent development process and highly appreciate any contributions. Whether you are helping us fix bugs, proposing new features or improving our documentation - we would love to have you as a part of the IF Food community. You can create github Issues or Pull Requests 

Not sure where to start? Join our discord and we will help you get started!

<a href="https://discord.gg/PTkjGrSXBP"><img src="https://amplication.com/images/discord_banner_purple.svg" /></a>

## Contributors

[//]: contributor-faces
<a href="https://github.com/jonathatargino"><img src="https://avatars.githubusercontent.com/u/102263444?v=4" title="jonathatargino" width="80" height="80"></a>

[//]: contributor-faces

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
