pipeline {
  agent any
    // environment {
    //     root = tool name: 'Go1.15.6', type: 'go'
    // }
  stages {
    stage('Install Dependency') {
      tools {nodejs "NodeJS15.4.0"}
      steps {
        sh 'cd store-web && npm install'
      }
    }

    stage('Code Analysis') {
      parallel {
        stage('Frontend') {
          tools {nodejs "NodeJS15.4.0"}
          steps {
            sh 'cd store-web && npm run lint'
          }
        }

        stage('Backend') {
          steps {
            script {
              def root = tool type: 'go', name: 'Go1.15.6'
              withEnv(["GOROOT=${root}", "PATH+GO=${root}/bin"]){
                sh 'cd store-service && go vet ./...'
              }
            }
          }
        }
      }
    }

    stage('Run Unit Testing') {
      parallel {
        stage('Frontend') {
          tools {nodejs "NodeJS15.4.0"}
          steps {
            sh 'cd store-web && npm test'
          }
        }

        stage('Backend') {
          steps {
            script{
              def root = tool type: 'go', name: 'Go1.15.6'
              withEnv(["GOROOT=${root}", "PATH+GO=${root}/bin"]){
                sh 'go get github.com/jstemmer/go-junit-report'
                sh 'cd store-service && go test -v -coverprofile=coverage.out ./... 2>&1 | /var/lib/jenkins/go/bin/go-junit-report > coverage.xml'
                junit 'store-service/*.xml'
              }
              def scannerHome = tool 'SonarQubeScanner';
              withSonarQubeEnv('SonarQubeScanner'){
                sh "${scannerHome}/bin/sonar-scanner"
              }
            }
          }
        }
      }
    }

    stage('Setup Test Fixtures') {
      steps {
        sh 'docker-compose up -d store-database bank-gateway shipping-gateway'
      }
    }

    stage('Run Integration Testing') {
      steps {
        sh 'sleep 20'
        sh 'cat tearup/init.sql | docker exec -i store-database /usr/bin/mysql -u sealteam --password=sckshuhari --default-character-set=utf8  toy'
        script{
          def root = tool type: 'go', name: 'Go1.15.6'
          withEnv(["GOROOT=${root}", "PATH+GO=${root}/bin"]){
            sh 'cd store-service && go test -tags=integration ./...'
          }
        }
      }
    }

    stage('Build Docker Images') {
      parallel {
        stage('Build Frontend') {
          steps {
            sh 'docker-compose build store-web'
          }
        }

        stage('Build Backend') {
          steps {
            sh 'docker-compose build store-service'
          }
        }

      }
    }

    stage('Provision And Deploy') {
      steps {
        sh 'docker-compose up -d'
        sh 'cat tearup/init.sql | docker exec -i store-database /usr/bin/mysql -u sealteam --password=sckshuhari --default-character-set=utf8  toy'
        sh 'curl http://localhost:8000/mockTime/01032020T13:30:00'
        // sh 'newman run atdd/api/shopping_cart_success.json -e atdd/api/environment/local_environment.json -d atdd/api/data/shopping_cart_success.json'
        // sh 'python3 -m robot atdd'
      }
    }

    stage('Run ATDD') {
      parallel {
        stage('API Testing by Newman') {
          steps {
            sh 'newman run atdd/api/shopping_cart_success.json -e atdd/api/environment/local_environment.json -d atdd/api/data/shopping_cart_success.json'
          }
        }
        stage('UI Testing and API Testing by Robot') {
          steps {
            sh 'python3 -m robot atdd'
          }
        }
      }
    }

    stage('Run Performance Testing') {
      steps {
        // sh 'k6 run --summary-trend-stats="avg,min,med,max,p(99),p(95),p(99.9),count" --summary-time-unit=ms -q atdd/load/k6-scripts/product-list.js  --out influxdb=http://54.254.108.7:38086/k6'
        sh 'k6 run --summary-trend-stats="avg,min,med,max,p(99),p(95),p(99.9),count" --summary-time-unit=ms -q atdd/load/k6-scripts/product-list.js'
      }
    }
  }
  post {
    always {
      robot outputPath: './', passThreshold: 100.0
      sh 'docker-compose down -v'
      // sh 'docker volume prune -f'
    }
  }
}