# Akashlytics

Analytics on the [Akash Network](https://akash.network/). Number of deployments, leased compute, price comparisons, graphs and more!

## Support

`akash13265twfqejnma6cc93rw5dxk4cldyz2zyy8cdm`

## Useful links

- [Website](https://www.akashlytics.com/deploy)
- [Youtube Channel (with tutorials)](https://www.youtube.com/channel/UC1rgl1y8mtcQoa9R_RWO0UA)
- [Discord](https://discord.gg/rXDFNYnFwv)
- [Twitter](https://twitter.com/thereisnomax)

## How to run locally

```
cd /api
npm start
cd /app
npm start
```

## Build and push the docker image

### Individually
```
docker build . -t baktun/akashlytics-api
docker push baktun/akashlytics-api
docker build . -t baktun/akashlytics-web --build-arg API_BASE_URL="https://api.akashlytics.com"
docker push baktun/akashlytics-web
```
### With docker compose
```
docker-compose build --build-arg API_BASE_URL="https://api.akashlytics.com"
docker push baktun/akashlytics-api
docker push baktun/akashlytics-web
```
