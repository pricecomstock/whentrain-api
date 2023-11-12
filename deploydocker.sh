project_name="whentrain-api"

docker kill $project_name-test >/dev/null
docker rm $project_name-test >/dev/null

function reloadprod {
  ssh root@pccloud "cd ~/docker/whentrain-nyc ; docker-compose pull ; docker-compose down ; docker-compose up -d"
}

function push {
  docker build --platform linux/amd64 --no-cache --tag=$project_name . 
  docker tag $project_name pricecomstock/$project_name
  docker push pricecomstock/$project_name:latest
}

function testcontainer {
  docker run --name $project_name-test --env-file .env -p 5001:80 $project_name > /dev/null &
  echo "Do you still wish to deploy? This will rebuild the container for x64"
  select yn in "Yes" "No"; do
      case $yn in
          Yes ) push; break;;
          No ) break;;
      esac
  done
  docker kill $project_name-test | xargs echo "killing"
  docker rm $project_name-test | xargs echo "removing"
}

docker build --no-cache --tag=$project_name .
echo ""
echo "=============================="
echo ""
echo "Container built!"
echo "You can either launch a test container on port 5001, or throw caution to the wind and just push to DockerHub"
echo "Please choose next step:"
select next in "Test" "Push" "Nothing"; do
  case $next in
    Test ) testcontainer; break;;
    Push ) push; break;;
    Nothing ) break;;
  esac
done

echo "Refresh prod?"
select next in "Refresh" "No"; do
  case $next in
    Refresh ) reloadprod; break;;
    No ) break;;
  esac
done