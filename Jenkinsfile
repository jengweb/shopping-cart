pipeline {
  agent any
    // environment {
    //     root = tool name: 'Go1.15.6', type: 'go'
    // }
  stages {
    stage('install dependency') {
      tools {nodejs "NodeJS15.4.0"}
      steps {
        sh 'cd store-web && npm install'
      }
    }

    stage('code analysis') {
      parallel {
        stage('code analysis frontend') {
          tools {nodejs "NodeJS15.4.0"}
          steps {
            sh 'cd store-web && npm run lint'
          }
        }

        stage('code analysis backend') {
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

    stage('run unit test') {
      parallel {
        stage('code analysis frontend') {
          tools {nodejs "NodeJS15.4.0"}
          steps {
            sh 'cd store-web && npm test'
          }
        }

        stage('code analysis backend') {
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

    stage('setup test fixtures') {
      steps {
        sh 'docker-compose up -d store-database bank-gateway shipping-gateway'
      }
    }

    stage('run integration test') {
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

    stage('build') {
      parallel {
        stage('build frontend') {
          steps {
            sh 'docker-compose build store-web'
          }
        }

        stage('build backend') {
          steps {
            sh 'docker-compose build store-service'
          }
        }

      }
    }

    stage('run ATDD') {
      steps {
        sh 'docker-compose up -d'
        sh 'cat tearup/init.sql | docker exec -i store-database /usr/bin/mysql -u sealteam --password=sckshuhari --default-character-set=utf8  toy'
        sh 'curl http://localhost:8000/mockTime/01032020T13:30:00'
        sh 'newman run atdd/api/shopping_cart_success.json -e atdd/api/environment/local_environment.json -d atdd/api/data/shopping_cart_success.json'
        sh 'python3 -m robot atdd'
        sh 'docker-compose down -v'
      }
    }

  }
  post {
    always {
      robot outputPath: './', passThreshold: 100.0
      sh 'docker-compose down -v'
      sh 'docker volume prune -f'
    }

  }
}