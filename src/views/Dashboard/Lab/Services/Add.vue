<style lang="scss" scoped>
.on-hover {
  cursor: pointer;
}
.image-placeholder{
  cursor: pointer;
  border: 1px solid lightgrey;
}
.services__modal-title {
  word-break: break-word;
}
</style>

<template>
  <div>
    <v-container>
      <v-dialog v-if="messageWarning" v-model="showModalAlert" persistent width="450">
        <v-card>
          <v-card-title class="services__modal-title">{{ messageWarning.title }}</v-card-title>
          <v-card-subtitle class="mt-1" v-html="messageWarning.subtitle"></v-card-subtitle>
          <v-card-actions>
            <v-btn
              block color="primary"
              @click="handleRedirect"
            >
              {{ messageWarning.actionTitle }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-row>
        <v-col cols="12" xl="8" lg="8" md="8" order-md="1" order="2">
            <v-card class="dg-card" elevation="0" outlined>
              <v-form ref="addServiceForm">
                <v-card-text class="px-8 pb-8 pt-10">              
                  <div class="mt-5 mb-12 justify-space-evenly" align="center">
                      <v-avatar
                        size="125"
                        @click="selectPicture"
                        rounded
                        class="image-placeholder"
                      >
                        <v-img v-if="!imageUrl" src="@/assets/add-image-placeholder.png" alt="image"></v-img>
                        <v-img v-else :src="imageUrl" alt="image"></v-img>
                        <v-file-input 
                          style="display: none"
                          hide-input
                          prepend-icon="mdi-camera"
                          accept="image/*" 
                          ref="fileInput"
                          @change="imageUploadEventListener" />
                      </v-avatar>

                  </div>
                    <v-select
                    dense
                    label="Service Category"
                    placeholder="Service Category"
                    v-model="category"
                    outlined
                    :items="listCategories"
                    :disabled="hasServicePayload"
                    item-text="service_categories"
                    item-value="service_categories"
                    :rules="fieldRequiredRule"
                    ></v-select>
                    
                    <v-select
                    dense
                    label="Type of Biological Sample"
                    placeholder="Type of Biological Sample"
                    v-model="biologicalType"
                    outlined
                    :items="listBiologicalType"
                    item-text="dnaCollectionProcess"
                    item-value="dnaCollectionProcess"
                    :rules="fieldRequiredRule"
                    ></v-select>

                    <v-text-field
                      dense
                      label="Service Name"
                      placeholder="Service Name"
                      outlined
                      v-model="name"
                      :rules="[...fieldRequiredRule, ...serviceNameRules, ...fieldEnglishRules]"
                    ></v-text-field>

                    <div class="d-flex">
                      <v-row>
                        <v-col>
                          <v-select
                          label="Currency"
                          outlined
                          dense
                          max="30"
                          v-model="currencyType"
                          :items="currencyList"
                          :rules="fieldRequiredRule"
                          :disabled="hasServicePayload"
                          ></v-select>
                        </v-col>
                        <v-col>
                          <v-text-field
                            dense
                            label="Price"
                            placeholder="e.g. 20.005"
                            outlined
                            v-model.number="price"
                            type="number"
                            min="0"
                            step=".001"
                            :rules="[...fieldRequiredRule, ...decimalRule]"
                          ></v-text-field>
                        </v-col>
                        <v-col>
                          <v-select
                          :disabled="isBiomedical || hasServicePayload"
                          label="QC Currency"
                          outlined
                          dense
                          v-model="currencyType"
                          :items="currencyList"
                          :rules="fieldRequiredRule"
                          ></v-select>
                        </v-col>
                        <v-col>
                          <v-text-field
                            :disabled="isBiomedical"
                            dense
                            label="QC Price"
                            placeholder="e.g. 20.005"
                            outlined
                            v-model.number="qcPrice"
                            type="number"
                            min="0"
                            step=".001"
                            :rules="[...fieldRequiredRule, ...decimalRule]"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>

                    <v-text-field
                      dense
                      label="Short Description"
                      placeholder="Short Description"
                      outlined
                      v-model="description"
                      :rules="[...fieldRequiredRule, ...descriptionRules, ...fieldEnglishRules]"
                    ></v-text-field>
                    
                    <v-row >
                      <v-col cols="8">
                        <v-text-field
                          dense
                          label="Expected Duration"
                          placeholder="Expected Duration"
                          min="0"
                          max="30"
                          outlined
                          type="number"
                          v-model="expectedDuration"
                          :rules="fieldRequiredRule"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="4">
                        <v-select
                          outlined
                          dense
                          v-model="selectExpectedDuration"
                          :items="listExpectedDuration"
                          :rules="fieldRequiredRule"
                        ></v-select>
                      </v-col>
                    </v-row>


                    <v-textarea
                      label="Long Description"
                      placeholder="Long Description"
                      outlined
                      v-model="longDescription"
                      :rules="[...fieldRequiredRule, ...longDescriptionRules, ...fieldEnglishRules]"
                    ></v-textarea>

                    <v-file-input
                      :rules="fileInputRules"
                      accept=".pdf"
                      dense
                      label="Test Result Sample"
                      placeholder="Test Result Sample"
                      prepend-icon="mdi-file-document"
                      outlined
                      v-model="testResultSampleFile"
                      @change="fileUploadEventListener"
                    ></v-file-input>

                    <v-btn
                      color="primary"
                      block
                      large
                      :disabled="isLoading"
                      :loading="isLoading"
                      @click="handleCreateService"
                    >Submit</v-btn>
                </v-card-text>
              </v-form>
            </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { upload } from "@/lib/ipfs"
import { createService, claimRequestService } from '@/lib/polkadotProvider/command/services'
import { queryLabsById } from "@/lib/polkadotProvider/query/labs";
import { getProvideRequestService, getCategories } from "@/lib/api";
import { toEther } from "@/lib/balance-format"

const englishAlphabet = val => (val && /^[A-Za-z0-9!@#$%^&*\\(\\)\-_=+:;"',.\\/? ]+$/.test(val)) || "This field can only contain English alphabet"

export default {
  name: 'AddLabServices',
  data: () => ({
    category: '',
    name: '',
    price: '',
    qcPrice: '',
    description: '',
    longDescription: '',
    imageUrl: "",
    testResultSampleUrl: "",
    statusLab: null,
    messageWarning: {},
    serviceFlow: "RequestTest",
    files: [],
    testResultSampleFile:[],
    listCategories:[],
    sampleFiles:[],
    isLoading: false,
    showModalAlert: false,
    currencyList: ['DAI', 'ETH'],
    currencyType: 'DAI',
    listExpectedDuration: [
      {text: 'Working Days', value: 'WorkingDays'},
      {text: 'Hours', value: 'Hours'},
      {text: 'Days', value: 'Days'}
    ],
    selectExpectedDuration: {text: 'Working Days', value: 'WorkingDays'},
    expectedDuration: '',
    biologicalType: "",
    listBiologicalType: [
      "Blood Cells - Dried Blood Spot Collection Process",
      "Epithelial Cells - Buccal Swab Collection Process",
      "Fecal Matters - Stool Collection Process",
      "Saliva - Saliva Collection Process",
      "Urine - Clean Catch Urine Collection Process",
    ],
    isBiomedical: false
  }),

  async mounted() {
    this.prefillValues()
    await this.getServiceCategory()
  },

  computed: {
    ...mapState({
      servicePayload: (state) => state.lab.providePayload,
      api: (state) => state.substrate.api,
      exist: (state) => state.substrate.isLabAccountExist,
      wallet: (state) => state.substrate.wallet,
      web3: (state) => state.metamask.web3,
      lastEventData: (state) => state.substrate.lastEventData,
    }),

    hasServicePayload() {
      return Boolean(Object.keys(this.servicePayload).length)
    },

    fieldRequiredRule() {
      return [
        val => !!val || 'This field is required'
      ]
    },

    serviceNameRules() {
      return [
        val => (val && val.length <= 50) || 'This field only allows 50 characters.'
      ]
    },

    decimalRule() {
      return [
        val => /^\d*(\.\d{0,3})?$/.test(val) || this.isBiomedical || 'This field only allows 3 decimal characters.'
      ]
    },

    fieldEnglishRules() {
      return [ englishAlphabet ]
    },

    descriptionRules() {
      return [
        val => (val && val.length <= 100) || 'This field only allows 100 characters.'
      ]
    },

    longDescriptionRules() {
      return [
        val => (val && val.length <= 255) || 'This field only allows 255 characters.'
      ]
    },

    fileInputRules() {
      return [
        value => !Array.isArray(value) || 'This field is required',
        value => (!Array.isArray(value) && value?.size < 2000000) || 'The total file size uploaded exceeds the maximum file size allowed (2MB)',
        value => (!Array.isArray(value) && value?.type === "application/pdf") || 'The files uploaded are not in the supported file formats.'
      ]
    },

  },

  created() {
    this.validate()
  },

  methods: {

    async validate () {
      const currentLab = await queryLabsById(this.api, this.wallet.address)

      const gitbookLink = `<a href="https://t.me/debionetwork" target="_blank">contact us</a>`

      const MESSAGE = Object.freeze({
        UNVERIFIED: {
          type: "UNVERIFIED",
          actionTitle: "Close",
          title: "Your verification process is still under review",
          subtitle: `
            We're sorry to say that you cannot provide a service until you are verified. 
            Please ${gitbookLink} for more infomation
          `
        },
        REJECTED: {
          type: "REJECTED",
          actionTitle: "Close",
          title: "Your verification process is rejected",
          subtitle: `
            We're sorry to say that you cannot provide a service because your verification status is rejected
            Please contact us ${gitbookLink} for more infomation
          `
        },
        REVOKED: {
          type: "REVOKED",
          actionTitle: "Close",
          title: "Your verification process is revoked",
          subtitle: `
            We're sorry to say that you cannot provide a service because your verification status is revoked
            Please contact us ${gitbookLink} for more infomation
          `
        },
        NOT_EXIST: {
          type: "NOT_EXIST",
          actionTitle: "Proceed",
          title: "You are not registered yet",
          subtitle: "Complete your registration process first before continue"
        },
        CITY_NOT_MATCH: {
          type: "CITY_NOT_MATCH",
          actionTitle: "Close",
          title: "Add service failed",
          subtitle: "Your location is not match with the requested service!"
        },
        UNEXPECTED: {
          type: "UNEXPECTED",
          actionTitle: "OK",
          title: "Oh no! Someting went wrong.",
          subtitle: "Please try again later"
        }
      })

      if (!currentLab) {
        this.showModalAlert = true

        this.messageWarning = MESSAGE["UNEXPECTED"]
      }

      if (Object.keys(this.servicePayload).length) {
        if (
          currentLab.verificationStatus === "Verified" &&
          currentLab.info?.country !== this.servicePayload.countryCode ||
          currentLab.info?.region !== this.servicePayload.cityCode
        ) {

          this.showModalAlert = true

          this.messageWarning = MESSAGE["CITY_NOT_MATCH"]

          return
        }
      }

      this.statusLab = currentLab.verificationStatus

      if (this.statusLab === "Verified") return

      const compute = !this.exist ? "NOT_EXIST" : currentLab.verificationStatus.toUpperCase()

      this.messageWarning = MESSAGE[compute]

      this.showModalAlert = true
    },

    async getServiceCategory() {
      const { data : data } = await getCategories()
      this.listCategories =  data
    },

    prefillValues() {
      const checkQuery = Object.keys(this.servicePayload).length
      if (!checkQuery) return

      const {
        category,
        currencyType,
        serviceFlow
      } = this.servicePayload

      this.category = category
      this.currencyType = currencyType
      this.serviceFlow = serviceFlow
    },

    async handleCreateService() {
      if(this.isLoading) return // If function already running return.
      if (!this.$refs.addServiceForm.validate()) {
        return
      }

      this.isLoading = true
      try {
        await createService(
          this.api,
          this.wallet,
          {
            name: this.name,
            pricesByCurrency: [
              {
                currency: this.currencyType,
                totalPrice: await toEther(this.price + this.qcPrice),
                priceComponents: [
                  {
                    component: "testing_price",
                    value: await toEther(this.price)
                  }
                ],
                additionalPrices: [
                  {
                    component: "qc_price",
                    value: await toEther(this.qcPrice)
                  }
                ],
              },
            ],
            expectedDuration: { 
              duration: this.expectedDuration, 
              durationType: this.selectExpectedDuration.value
            },
            category: this.category,
            description: this.description,
            testResultSample: this.testResultSampleUrl,
            longDescription: this.longDescription,
            image: this.imageUrl,
            dnaCollectionProcess: this.biologicalType
          },
          this.serviceFlow
        )
      } catch (error) {
        this.isLoading = false
        console.error(error)
      }
    },

    imageUploadEventListener(file) {
      this.isLoading = true
      this.imageUrl = ""
      if (file) {
        if (file.name.lastIndexOf('.') <= 0) {
          return
        }
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)

        const context = this
        fr.addEventListener('load', async () => {
          // Upload
          const uploaded = await upload({
            fileChunk: fr.result,
            fileType: file.type,
            fileName: file.name,
          })
          const computeLink = `${uploaded.ipfsPath[0].data.ipfsFilePath}/${uploaded.fileName}`

          context.imageUrl = `https://ipfs.io/ipfs/${computeLink}`
          context.isUploading = false
          context.isLoading = false
        })
      }
    },

    fileUploadEventListener(file) {
      if (!file || file.size >= 2000000) {
        return
      }
      this.isLoading = true
      this.testResultSampleUrl = ""
      if (file) {
        if (file.name.lastIndexOf('.') <= 0) {
          return
        }
        const fr = new FileReader()
        fr.readAsArrayBuffer(file)

        const context = this
        fr.addEventListener('load', async () => {
          // Upload
          const uploaded = await upload({
            fileChunk: fr.result,
            fileType: file.type,
            fileName: file.name,
          })
          const computeLink = `${uploaded.ipfsPath[0].data.ipfsFilePath}/${uploaded.fileName}`

          context.testResultSampleUrl = `https://ipfs.io/ipfs/${computeLink}`
          context.isUploading = false
          context.isLoading = false
        })
      }
    },

    async handleClaimRequest(id) {
      try {
        if (Object.keys(this.servicePayload).length) {
          const dataRequestServices = await getProvideRequestService(this.servicePayload)

          const requests = []

          for (let i=0; i < dataRequestServices.length; i++) {
            requests.push(
              claimRequestService(this.api, this.wallet, {
                id,
                hash: dataRequestServices[i].request.hash,
                testing_price: await toEther(this.price),
                qc_price: await toEther(this.qcPrice)
              })
            )
          }

          this.isLoading = true
          await this.handleProcessClaim(requests)
        }
      } catch (error) {
        console.error(error);
        this.isLoading = false
      }
    },

    async handleProcessClaim(requests) {
      try {
        await Promise.all(requests)
        this.isLoading = false

        this.$router.push('/lab/services')
        this.$store.dispatch("lab/setProvideService", {})
      } catch (error) {
        this.isLoading = false
        console.error(error)
      }
    },

    handleRedirect() {
      const REDIRECT_TO = Object.freeze({
        UNVERIFIED: {
          name: "lab-dashboard"
        },
        REJECTED: {
          name: "lab-dashboard"
        },
        REVOKED: {
          name: "lab-dashboard"
        },
        NOT_EXIST: {
          name: "lab-registration"
        },
        CITY_NOT_MATCH: {
          name: "lab-dashboard-services"
        }
      })

      if (this.messageWarning?.type === "CITY_NOT_MATCH") {
        this.$router.push(REDIRECT_TO["CITY_NOT_MATCH"])

        return
      }

      const compute = !this.exist ? "NOT_EXIST" : this.statusLab.toUpperCase()

      this.$router.push(REDIRECT_TO[compute])
    },

    selectPicture() {
      this.$refs.fileInput.$refs.input.click()
    }
  },
  
  watch: {
    category() {
      if (this.category == 'Covid-19') {
        this.isBiomedical = true
        this.qcPrice = "0"
      } else {
        this.isBiomedical = false
      }
    },

    lastEventData(val) {
      if (val === null) return
      const dataEvent = JSON.parse(val.data.toString())
      if (val.method === "ServiceCreated") {
        if (
          dataEvent[1] === this.wallet.address &&
          Object.keys(this.servicePayload).length
        ) this.handleClaimRequest(dataEvent[0].id)

        else this.$router.push('/lab/services')
      }
    }
  }
}
</script>