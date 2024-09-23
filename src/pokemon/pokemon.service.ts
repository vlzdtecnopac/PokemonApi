import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map, Observable, switchMap } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { LanguageType } from './enum';
import {
  PokemonListResponse,
  PokemonOneReponse,
  Result,
  Type,
} from './interface';

@Injectable()
export class PokemonService {
  private readonly logger = new Logger(PokemonService.name);
  private _url = process.env.POKEMON_API_URL;

  constructor(private httpService: HttpService) {}

  async findAll(
    limit: number,
    offset: number,
  ): Promise<{
    count: number;
    limit: number;
    offset: number;
    results: Result[];
  }> {
    try {
      const response: AxiosResponse<PokemonListResponse> = await firstValueFrom(
        this.httpService.get(
          `${this._url}/pokemon?limit=${limit}&offset=${offset}`,
        ),
      );

      return {
        count: response.data.count,
        limit: limit,
        offset: offset,
        results: response.data.results,
      };
    } catch (error) {
      this.logger.error(error);
      throw new NotFoundException(`Pokémon List not found.`);
    }
  }

  async findOne(
    name: string,
  ): Promise<Observable<{ name: string; types: Type[] }>> {
    return this.httpService.get(`${this._url}/pokemon/${name}`).pipe(
      map((response: AxiosResponse<PokemonOneReponse>) => {
        if (!response.data) {
          throw new NotFoundException(`Pokémon ${name} not found.`);
        }
        return {
          name: response.data.name,
          types: response.data.types,
        };
      }),
      catchError((error) => {
        this.logger.error(error);
        throw new NotFoundException(`Pokémon ${name} not found.`);
      }),
    );
  }

  async pokemonAndType(name: string): Promise<
    Observable<{
      name: string;
      types: {
        slot: number;
        type: { name: string; url: string; translations: { es: any; ja: any } };
      }[];
    }>
  > {
    try {
      const pokemonOne: Observable<{
        name: string;
        types: Type[];
      }> = await this.findOne(name);

      return pokemonOne.pipe(
        switchMap(async (pokemon) => {
          if (!pokemon) {
            throw new NotFoundException('Pokemon not found');
          }

          const typesRequests = pokemon.types.map((typeInfo: Type) =>
            axios.get(typeInfo.type.url).then((typeResponse) => {
              const translations = typeResponse.data.names;

              const spanishTranslation = translations.find(
                (t) => t.language.name === LanguageType.es,
              );
              const japaneseTranslation = translations.find(
                (t) => t.language.name === LanguageType.ja,
              );

              return {
                slot: typeInfo.slot,
                type: {
                  name: typeInfo.type.name,
                  url: typeInfo.type.url,
                  translations: {
                    es: spanishTranslation?.name,
                    ja: japaneseTranslation?.name,
                  },
                },
              };
            }),
          );

          const types = await Promise.all(typesRequests);
          return {
            name: pokemon.name,
            types,
          };
        }),
        map((response) => response),
      );
    } catch (error) {
      this.logger.error(error);
      throw new NotFoundException(`Pokémon List not found.`);
    }
  }
}
