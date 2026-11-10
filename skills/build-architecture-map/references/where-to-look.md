# Where to look

Search hints by concern and ecosystem. They find **candidates**; every candidate still needs a line that proves
it (see `evidence-rules.md`). Use `git grep -n -E '<pattern>' <head> -- <glob>` on the default branch.

## 1. What is in a repo

| Look for | Tells you |
|---|---|
| `build.sbt`, `project/*.scala`, `pom.xml`, `build.gradle(.kts)`, `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements*.txt`, `*.csproj`, `Gemfile`, `mix.exs` | Language, modules, which libraries it uses (hints only) |
| `Dockerfile`, `Procfile`, `*.service`, `Chart.yaml`, `values*.yaml`, `k8s/`, `deploy/`, `kustomization.yaml`, `docker-compose*.yml`, `*.tf`, `serverless.yml`, `app.yaml` | What is deployed, as what, with which env vars and neighbours |
| `main` entry points: `extends App`, `def main(`, `IOApp`, `ZIOAppDefault`, `@SpringBootApplication`, `func main()`, `if __name__ == "__main__"`, `"start":` script | Which modules actually run |
| `openapi*.y*ml`, `swagger*`, `*.proto`, `*.graphql(s)`, `*.avsc`, `asyncapi*.y*ml`, `*.thrift` | Contracts: endpoints, rpcs, message shapes |
| `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `bitbucket-pipelines.yml`, `azure-pipelines.yml`, `.circleci/` | How it is built, tested and shipped (facts) |
| `CODEOWNERS`, `CONTRIBUTING.md`, `docs/adr/`, `.scalafmt.conf`, `.editorconfig`, lint configs | Ownership and conventions (facts, hints) |
| Monorepos: `settings.gradle`, sbt `lazy val x = project`, `pnpm-workspace.yaml`, `nx.json`, `go.work` | Which sub-projects are separate components |

## 2. Inbound: what a component exposes

| Ecosystem | Patterns |
|---|---|
| Scala | Akka/Pekko HTTP `path(`, `pathPrefix(`, `concat(`; http4s `HttpRoutes.of`, `case GET -> Root /`; Tapir `endpoint.get.in(`; Play `conf/routes`; ZIO HTTP `Routes(`, `Method.GET /`; Finagle/Finatra `get("/` |
| Java / Kotlin | `@RestController`, `@RequestMapping`, `@GetMapping`, `@Path(`, `@GET`, Ktor `routing {`, `get("/`, Micronaut `@Controller`, Quarkus `@Path`, Vert.x `router.route(` |
| gRPC (any) | `service X {` / `rpc Y(` in `.proto`; server: `bindService`, `addService(`, `extends XGrpc.XImplBase`, ScalaPB `XFs2Grpc`, `XGrpc.bindService` |
| Node / TS | `app.get(`, `router.post(`, `fastify.route(`, NestJS `@Controller(`, `@Get(`, Next.js `app/api/**/route.ts`, `pages/api/` |
| Python | `@app.get(`, `@router.post(`, `@app.route(`, Django `urls.py` `path(`, `@api_view` |
| Go | `http.HandleFunc(`, `mux.HandleFunc(`, `r.GET(`, `e.POST(`, `chi.Router`, `.Handle(` |
| .NET | `[ApiController]`, `[Route(`, `[HttpGet`, `app.MapGet(` |
| GraphQL | schema files, `type Query`, resolvers (`@QueryMapping`, Caliban `RootResolver`, Sangria `ObjectType(`) |

## 3. Outbound: who it calls

| Kind | Patterns |
|---|---|
| HTTP clients | Scala sttp `basicRequest`, `quickRequest`, `uri"`; http4s `Client[F]`, `client.expect`; Akka/Pekko `Http().singleRequest`; Play `ws.url(`; Java `RestTemplate`, `WebClient`, `@FeignClient`, `HttpClient.newHttpClient`, OkHttp `Request.Builder`, Retrofit `@GET`; JS `fetch(`, `axios.`, `got(`; Python `requests.`, `httpx.`, `aiohttp`; Go `http.NewRequest`, `http.Get(`; .NET `HttpClient`, `AddHttpClient` |
| Base URLs | Config keys ending `url`, `uri`, `host`, `endpoint`, `base-url`; HOCON `application.conf` / `reference.conf` with `${?ENV_VAR}`; `application.yml`, `.env.example`, Helm `values.yaml` `env:`, compose `environment:` |
| gRPC clients | `newBlockingStub(`, `newStub(`, `ManagedChannelBuilder.forAddress`, ScalaPB `XGrpc.stub(`, `XFs2Grpc.stub`, `grpc.Dial(`, `grpc.NewClient(` |
| Service discovery | Kubernetes `Service` names in URLs (`http://payments:8080`), Consul, Eureka `@EnableDiscoveryClient`, gateway route files (Kong, Envoy, NGINX `location`, Traefik labels, HAProxy `backend`) |

## 4. Messaging

| Broker | Producer | Consumer |
|---|---|---|
| Kafka | `KafkaProducer`, `ProducerRecord(`, fs2-kafka `KafkaProducer`, `ProducerSettings`, Alpakka `Producer.plainSink`, zio-kafka `Producer.produce`, Spring `KafkaTemplate.send(` | `subscribe(`, fs2-kafka `KafkaConsumer`, `ConsumerSettings`, Alpakka `Consumer.committableSource`, Spring `@KafkaListener(topics` |
| RabbitMQ / AMQP | `basicPublish(`, `RabbitTemplate.convertAndSend(`, exchange and routing key constants | `basicConsume(`, `queueBind(`, `@RabbitListener` |
| Cloud queues | SQS `sendMessage`, SNS `publish`, Pub/Sub `publisher.publish`, Azure Service Bus `ServiceBusSender` | SQS `receiveMessage`, Lambda event source mappings, Pub/Sub subscriptions, `ServiceBusProcessor` |
| Others | NATS `publish(`, Redis `PUBLISH`/`XADD`, Pulsar `newProducer` | NATS `subscribe(`, `XREADGROUP`, `newConsumer` |

Topic names are often constants or config: find the name, then grep every repo for it to find both ends.

## 5. Data stores

| Store | Patterns |
|---|---|
| SQL | `jdbc:postgresql`, `jdbc:mysql`, Slick `Database.forConfig`, Doobie `Transactor.fromDriverManager`, Quill `PostgresJdbcContext`, Skunk `Session.pooled`, ScalikeJDBC, JPA `@Entity`, `@Table(name`, Flyway `db/migration/V*__*.sql`, Liquibase changelogs, Prisma `schema.prisma`, SQLAlchemy `create_engine(` |
| Cassandra | `CqlSession`, `keyspace`, `CREATE TABLE` in `.cql` |
| MongoDB | `MongoClient`, `mongodb://`, `getCollection(` |
| Redis | `RedisClient`, `redis://`, `Jedis`, `Lettuce`, `redis4cats` |
| Search | `ElasticClient`, `RestHighLevelClient`, `opensearch` |
| Object storage | `S3Client`, `putObject(`, `bucket`, GCS `Storage`, Azure `BlobServiceClient` |

## 6. Front ends and clients

`package.json` with `react`, `vue`, `angular`, `next`, `svelte`; mobile `build.gradle` with `com.android.application`,
`*.xcodeproj`, Flutter `pubspec.yaml`. Find the API base URL (`.env*`, `environment*.ts`, `config.js`) and the API
calls (`fetch(`, `axios`, generated clients). Only claim the back ends the code really calls.

## 7. Observability and operations (facts and links)

Dashboards and alerts **in git** (`dashboards/*.json`, `*.rules.yml`, `PrometheusRule`, Grafana provisioning)
are evidence for facts such as "Orders exports metrics scraped by Prometheus". Dashboards that live only in
Grafana are links, not evidence. Metric names (`Counter.build().name(`, Kamon, Micrometer `registry.counter(`)
help connect a component to its dashboard.

## 8. Tests worth linking

Integration and end-to-end tests that call a flow's real endpoints: Scala `*Spec.scala` / `*IT.scala` (ScalaTest,
MUnit, specs2, Weaver), Java `*IT.java`, `@SpringBootTest`, Testcontainers, Pact contract tests
(`*.pact.json`, `@Pact`), Cypress / Playwright specs for UIs. Check the test is not skipped
(`ignore`, `@Disabled`, `.skip`, `pending`, `xit`, `@pytest.mark.skip`).
