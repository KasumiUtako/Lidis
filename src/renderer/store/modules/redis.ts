import { Module, ActionTree, MutationTree, GetterTree } from 'vuex';
import { RootState } from '@/store/state';
import { Redis, default as IORedis } from 'ioredis';
import {
  RedisState,
  DBConnectionState,
  ItemState,
  CurrentState
} from '@/store/modules/redisState';
import { map } from '@/lib/asyncro';

const RedisErrors = {
  unknowTypeError: () => new Error('UNKNOW TYPE ERROR')
};

const state: RedisState = {
  keys: [],
  state: DBConnectionState.WAIT,
  instance: null,

  current: {
    key: '',
    type: '',
    data: ''
  }
};

const actions: ActionTree<RedisState, RootState> = {
  newKey: async (
    { state: { instance, keys }, commit },
    { type, key }: ItemState
  ) => {
    if (instance) {
      let res;
      switch (type) {
        case 'string':
          res = await instance.setnx(key, '');
          break;
        case 'list':
          res = await instance.rpush(key, '');
          break;
        default:
          res = RedisErrors.unknowTypeError();
      }
      console.log(res);
      if (res) {
        const newKeys = [{ type, key }].concat(keys);
        commit('setKeys', newKeys);
      }
    }
  },
  setCurrentKey: async (
    { state: { instance }, commit },
    { type, key }: ItemState
  ) => {
    if (instance) {
      let data;
      switch (type) {
        case 'string':
          data = await instance.get(key);
          break;
        case 'list':
          data = await instance.lrange(key, 0, -1);
          break;
        default:
          data = '';
      }
      commit('setCurrentKey', { data, type, key });
    }
  },

  getItemsByKey: async ({ state: { instance }, commit }, payload: string) => {
    if (instance) {
      const keys = await instance.keys(payload);
      const data = await map(keys, async key => ({
        key,
        type: await instance.type(key)
      }));
      commit('setKeys', data);
    }
  },

  connectRedis: ({ rootState: { connectionConfig }, commit }) => {
    const opts = {
      port: connectionConfig.port,
      host: connectionConfig.host,
      password: connectionConfig.password
    };
    const redisInstance = new IORedis(opts);
    commit('updateStatu', DBConnectionState.USING);
    commit('updateInstance', redisInstance);
  }
};

const mutations: MutationTree<RedisState> = {
  setCurrentKey: (state, payload: CurrentState) => (state.current = payload),
  setKeys: (state, paylaod: ItemState[]) => (state.keys = paylaod),
  updateStatu: (state, payload: DBConnectionState) => (state.state = payload),
  updateInstance: (state, payload: Redis) => (state.instance = payload)
};

const getters: GetterTree<RedisState, RootState> = {
  keys: state => state.keys,
  current: state => state.current,
  supportTypes: () => ['string', 'list']
};

export const redis: Module<RedisState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
};
